<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'
import FormInput from '@/components/common/FormInput.vue'
import * as secretsManager from '@/api/services/secrets-manager'

const settingsStore = useSettingsStore()

const secrets = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Create modal state
const showCreateModal = ref(false)
const newSecretName = ref('')
const newSecretValue = ref('')
const newSecretDescription = ref('')
const creating = ref(false)

// View/Edit modal state
const showViewModal = ref(false)
const selectedSecret = ref<any>(null)
const secretValue = ref('')
const secretLoading = ref(false)
const secretError = ref<string | null>(null)
const isEditing = ref(false)
const editSecretValue = ref('')

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List secrets
aws secretsmanager list-secrets --endpoint-url ${settingsStore.endpoint}

# Get secret value
aws secretsmanager get-secret-value --secret-id my-secret --endpoint-url ${settingsStore.endpoint}

# Create secret
aws secretsmanager create-secret \\
  --name my-secret \\
  --secret-string '{"username":"admin","password":"secret123"}' \\
  --endpoint-url ${settingsStore.endpoint}

# Delete secret
aws secretsmanager delete-secret --secret-id my-secret --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SecretsManagerClient, ListSecretsCommand, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List secrets
const listResponse = await client.send(new ListSecretsCommand({}));
console.log(listResponse.SecretList);

// Get secret value
const valueResponse = await client.send(new GetSecretValueCommand({
  SecretId: 'my-secret',
}));
console.log(valueResponse.SecretString);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'secretsmanager',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List secrets
response = client.list_secrets()
for secret in response['SecretList']:
    print(secret['Name'])

# Get secret value
response = client.get_secret_value(SecretId='my-secret')
print(response['SecretString'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
    config.WithEndpointResolverWithOptions(
        aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (
                aws.Endpoint, error,
            ) {
                return aws.Endpoint{
                    URL: "${settingsStore.endpoint}",
                }, nil
            },
        ),
    ),
)

client := secretsmanager.NewFromConfig(cfg)

// List secrets
listOutput, _ := client.ListSecrets(context.Background(), 
    &secretsmanager.ListSecretsInput{})
fmt.Println(listOutput.SecretList)

// Get secret value
valueOutput, _ := client.GetSecretValue(context.Background(),
    &secretsmanager.GetSecretValueInput{SecretId: "my-secret"})
fmt.Println(*valueOutput.SecretString)`
  },
])

async function loadSecrets() {
  loading.value = true
  error.value = null
  
  try {
    const response = await secretsManager.listSecrets()
    secrets.value = response.SecretList || []
  } catch (e: any) {
    error.value = e.message
    secrets.value = []
  } finally {
    loading.value = false
  }
}

// Open create modal
function openCreateModal() {
  newSecretName.value = ''
  newSecretValue.value = ''
  newSecretDescription.value = ''
  showCreateModal.value = true
}

// Create secret
async function createSecret() {
  if (!newSecretName.value.trim() || !newSecretValue.value.trim()) return
  
  creating.value = true
  error.value = null
  try {
    await secretsManager.createSecret({
      Name: newSecretName.value.trim(),
      SecretString: newSecretValue.value.trim(),
      Description: newSecretDescription.value.trim() || undefined,
    })
    showCreateModal.value = false
    newSecretName.value = ''
    newSecretValue.value = ''
    newSecretDescription.value = ''
    await loadSecrets()
  } catch (e: any) {
    error.value = 'Failed to create secret: ' + e.message
  } finally {
    creating.value = false
  }
}

// View secret
async function viewSecret(secret: any) {
  selectedSecret.value = secret
  secretValue.value = ''
  secretError.value = null
  isEditing.value = false
  showViewModal.value = true
  secretLoading.value = true

  try {
    const response = await secretsManager.getSecretValue(secret.Name)
    secretValue.value = response.SecretString || ''
    editSecretValue.value = response.SecretString || ''
  } catch (e: any) {
    secretError.value = 'Failed to get secret value: ' + e.message
  } finally {
    secretLoading.value = false
  }
}

// Toggle edit mode
function toggleEdit() {
  if (isEditing.value) {
    // Cancel editing - restore original value
    editSecretValue.value = secretValue.value
  }
  isEditing.value = !isEditing.value
}

// Save secret changes
async function saveSecretValue() {
  if (!selectedSecret.value) return
  
  secretLoading.value = true
  secretError.value = null
  
  try {
    await secretsManager.putSecretValue({
      SecretId: selectedSecret.value.Name,
      SecretString: editSecretValue.value.trim()
    })
    secretValue.value = editSecretValue.value.trim()
    isEditing.value = false
  } catch (e: any) {
    secretError.value = 'Failed to update secret: ' + e.message
  } finally {
    secretLoading.value = false
  }
}

// Delete secret
async function deleteSecret(name: string) {
  if (!confirm(`Delete secret "${name}"? This cannot be undone.`)) return
  
  loading.value = true
  try {
    await secretsManager.deleteSecret(name)
    await loadSecrets()
  } catch (e: any) {
    error.value = 'Failed to delete secret: ' + e.message
  } finally {
    loading.value = false
  }
}

// Close view modal
function closeViewModal() {
  showViewModal.value = false
  selectedSecret.value = null
  secretValue.value = ''
  editSecretValue.value = ''
  isEditing.value = false
}

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

// Format secret value preview
function formatSecretPreview(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value.length > 100 ? value.substring(0, 100) + '...' : value
  }
}

// Check if value is JSON
function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

onMounted(() => {
  loadSecrets()
})

// Example code tabs
const selectedExample = ref(0)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
        >
          Secrets Manager
        </h1>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          {{ secrets.length }} secret(s) found
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          @click="openCreateModal"
        >
          + Create Secret
        </button>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="loadSecrets"
        >
          ↻ Refresh
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading...
      </p>
    </div>

    <div v-if="!loading">
      <div
        v-if="secrets.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No secrets found. Create one to get started!
        </p>
      </div>
      
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="secret in secrets"
          :key="secret.Name"
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3
                class="font-semibold text-lg"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                🔐 {{ secret.Name }}
              </h3>
              <p
                class="text-sm mt-1 truncate"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ secret.Description || 'No description' }}
              </p>
              <p
                class="text-xs mt-2"
                :class="settingsStore.darkMode ? 'text-gray-500' : 'text-gray-400'"
              >
                Created: {{ formatDate(secret.CreatedDate) }}
              </p>
            </div>
            <div class="flex gap-2 ml-4">
              <button
                class="px-3 py-1 text-blue-500 hover:text-blue-700 border border-blue-500 rounded hover:bg-blue-50"
                @click="viewSecret(secret)"
              >
                View
              </button>
              <button
                class="px-3 py-1 text-red-500 hover:text-red-700 border border-red-500 rounded hover:bg-red-50"
                @click="deleteSecret(secret.Name)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Example Code Section -->
    <div class="mt-8">
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Secret Modal -->
  <Modal
    :open="showCreateModal"
    title="Create Secret"
    @update:open="showCreateModal = $event"
    @close="showCreateModal = false"
  >
    <div class="space-y-4">
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Secret Name *
        </label>
        <input
          v-model="newSecretName"
          type="text"
          placeholder="my-secret"
          class="w-full px-3 py-2 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        >
      </div>
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Secret Value * (JSON or plain text)
        </label>
        <textarea
          v-model="newSecretValue"
          rows="4"
          placeholder="{&quot;username&quot;: &quot;admin&quot;, &quot;password&quot;: &quot;secret123&quot;}"
          class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Description (optional)
        </label>
        <input
          v-model="newSecretDescription"
          type="text"
          placeholder="Database credentials for production"
          class="w-full px-3 py-2 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        >
      </div>
    </div>
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showCreateModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="!newSecretName.trim() || !newSecretValue.trim() || creating"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        @click="createSecret"
      >
        {{ creating ? 'Creating...' : 'Create' }}
      </button>
    </template>
  </Modal>

  <!-- View/Edit Secret Modal -->
  <Modal
    :open="showViewModal"
    :title="selectedSecret?.Name || 'Secret Details'"
    size="lg"
    @update:open="showViewModal = $event"
    @close="closeViewModal"
  >
    <!-- Loading -->
    <div
      v-if="secretLoading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading secret...
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="secretError"
      class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ secretError }}
    </div>

    <!-- Secret Content -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Secret Info -->
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >Created:</span>
            <p :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">
              {{ formatDate(selectedSecret?.CreatedDate) }}
            </p>
          </div>
          <div v-if="selectedSecret?.Description">
            <span
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >Description:</span>
            <p :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">
              {{ selectedSecret.Description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Secret Value -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Secret Value
          </label>
          <span
            v-if="secretValue && isJson(secretValue)"
            class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            JSON
          </span>
        </div>
        
        <!-- View Mode -->
        <div v-if="!isEditing">
          <pre 
            class="p-4 rounded-lg border overflow-auto max-h-64 text-sm font-mono"
            :class="settingsStore.darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'"
          >{{ secretValue || '(empty)' }}</pre>
        </div>
        
        <!-- Edit Mode -->
        <div v-else>
          <textarea
            v-model="editSecretValue"
            rows="8"
            class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          />
        </div>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="closeViewModal"
      >
        Close
      </button>
      
      <template v-if="!secretLoading && !secretError">
        <button
          v-if="!isEditing"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          @click="toggleEdit"
        >
          Edit Value
        </button>
        <template v-else>
          <button
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
            @click="toggleEdit"
          >
            Cancel
          </button>
          <button
            :disabled="secretLoading"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            @click="saveSecretValue"
          >
            {{ secretLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </template>
      </template>
    </template>
  </Modal>
</template>
