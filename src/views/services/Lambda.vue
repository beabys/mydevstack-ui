<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import * as lambda from '@/api/services/lambda'
import type { LambdaFunction } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const functions = ref<LambdaFunction[]>([])
const loading = ref(false)
const selectedFunction = ref<LambdaFunction | null>(null)

// Modal state
const showCreateModal = ref(false)
const showInvokeModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const showExamples = ref(false)

// Default role ARN for LocalStack/Floci
const DEFAULT_ROLE_ARN = 'arn:aws:iam::123456789012:role/test'

// Form state
const createForm = ref({
  functionName: '',
  runtime: 'nodejs22.x',
  handler: 'index.handler',
  memory: 128,
  timeout: 30,
  roleArn: DEFAULT_ROLE_ARN,
  zipFile: null as File | null,
  architecture: 'amd64',
  environment: '',
})

const invokeForm = ref({
  payload: '{}',
  invocationType: 'RequestResponse',
})

const editForm = ref({
  memory: 128,
  timeout: 30,
})

const invokeResult = ref('')
const invokeLoading = ref(false)
const creating = ref(false)
const updating = ref(false)

// Runtime options (official AWS Lambda runtimes)
const runtimeOptions = [
  // Node.js
  { value: 'nodejs22.x', label: 'Node.js 22' },
  { value: 'nodejs20.x', label: 'Node.js 20' },
  // Python
  { value: 'python3.14', label: 'Python 3.14' },
  { value: 'python3.13', label: 'Python 3.13' },
  { value: 'python3.12', label: 'Python 3.12' },
  { value: 'python3.11', label: 'Python 3.11' },
  // Java
  { value: 'java21', label: 'Java 21' },
  { value: 'java17', label: 'Java 17' },
  { value: 'java11', label: 'Java 11' },
  // .NET
  { value: 'dotnet8', label: '.NET 8' },
  { value: 'dotnet6', label: '.NET 6' },
  // Ruby
  { value: 'ruby3.3', label: 'Ruby 3.3' },
  // Go / Custom Runtimes
  { value: 'provided.al2023', label: 'provided.al2023' },
  { value: 'provided.al2', label: 'provided.al2' },
]

// Architecture options
const architectureOptions = [
  { value: 'amd64', label: 'x86_64 (amd64)' },
  { value: 'arm64', label: 'arm64' },
]

const invocationTypes = [
  { value: 'RequestResponse', label: 'Synchronous' },
  { value: 'Event', label: 'Asynchronous' },
  { value: 'DryRun', label: 'Dry Run' },
]

// Columns
const columns = computed(() => [
  { key: 'FunctionName', label: 'Function Name', sortable: true },
  { key: 'Runtime', label: 'Runtime', sortable: true },
  { key: 'MemorySize', label: 'Memory', sortable: true },
  { key: 'Timeout', label: 'Timeout', sortable: true },
  { key: 'LastModified', label: 'Last Modified', sortable: true },
])

// Code examples
const selectedExample = ref(0)
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List Lambda functions
aws lambda list-functions --endpoint-url ${settingsStore.endpoint}

# Create function
aws lambda create-function \
  --function-name my-function \
  --runtime nodejs22.x \
  --handler index.handler \
  --role arn:aws:iam::123456789012:role/lambda-role \
  --zip-file fileb://function.zip \
  --endpoint-url ${settingsStore.endpoint}

# Invoke function
aws lambda invoke \\
  --function-name my-function \\
  --payload '{"key": "value"}' \\
  --invocation-type RequestResponse \\
  --endpoint-url ${settingsStore.endpoint} \\
  response.json

# Update function configuration
aws lambda update-function-configuration \\
  --function-name my-function \\
  --memory-size 256 \\
  --timeout 60 \\
  --endpoint-url ${settingsStore.endpoint}

# Delete function
aws lambda delete-function \\
  --function-name my-function \\
  --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { LambdaClient, ListFunctionsCommand, InvokeCommand, CreateFunctionCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List functions
const listResponse = await client.send(new ListFunctionsCommand({}));
console.log(listResponse.Functions);

// Create function
await client.send(new CreateFunctionCommand({
  FunctionName: 'my-function',
  Runtime: 'nodejs22.x',
  Handler: 'index.handler',
  Role: 'arn:aws:iam::123456789012:role/lambda-role',
  Code: { ZipFile: fs.readFileSync('function.zip') },
}));

// Invoke function
const invokeResponse = await client.send(new InvokeCommand({
  FunctionName: 'my-function',
  InvocationType: 'RequestResponse',
  Payload: JSON.stringify({ key: 'value' }),
}));
const responseBody = JSON.parse(invokeResponse.Payload.transformToString());`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'lambda',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List functions
response = client.list_functions()
for func in response['Functions']:
    print(func['FunctionName'])

# Invoke function
response = client.invoke(
    FunctionName='my-function',
    InvocationType='RequestResponse',
    Payload=json.dumps({'key': 'value'}),
)
result = json.loads(response['Payload'].read())
print(result)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/lambda"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
    config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
        "${settingsStore.accessKey}",
        "${settingsStore.secretKey}",
        "",
    )),
)

client := lambda.NewFromConfig(cfg, func(o *lambda.Options) {
    o.BaseURL = aws.String("${settingsStore.endpoint}")
})

// List functions
listOutput, _ := client.ListFunctions(context.Background(), &lambda.ListFunctionsInput{})
fmt.Println(listOutput.Functions)

// Invoke function
invokeOutput, _ := client.Invoke(context.Background(), &lambda.InvokeInput{
    FunctionName: aws.String("my-function"),
    InvocationType: lambda.InvocationTypeRequestResponse,
    Payload: json.Marshal(map[string]string{"key": "value"}),
})
fmt.Println(invokeOutput.Payload)`
  },
])

async function loadFunctions() {
  loading.value = true
  try {
    const result = await lambda.listFunctions()
    functions.value = result.functions || []
  } catch (error) {
    console.error('Error loading functions:', error)
    toast.error('Failed to load Lambda functions')
  } finally {
    loading.value = false
  }
}

function handleZipFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    createForm.value.zipFile = target.files[0]
  }
}

async function createFunction() {
  if (!createForm.value.functionName.trim()) {
    toast.error('Function name is required')
    return
  }

  creating.value = true
  try {
    // Handle ZIP file if selected
    let zipFileData: Uint8Array | undefined
    if (createForm.value.zipFile) {
      zipFileData = await createForm.value.zipFile.arrayBuffer().then(buf => new Uint8Array(buf))
    }

    // Parse environment variables if provided
    let environment: { Variables: Record<string, string> } | undefined
    if (createForm.value.environment.trim()) {
      try {
        environment = { Variables: JSON.parse(createForm.value.environment) }
      } catch {
        toast.error('Invalid environment JSON format')
        creating.value = false
        return
      }
    }

    await lambda.createFunction({
      FunctionName: createForm.value.functionName,
      Runtime: createForm.value.runtime,
      Handler: createForm.value.handler,
      MemorySize: createForm.value.memory,
      Timeout: createForm.value.timeout,
      Role: createForm.value.roleArn,
      Code: zipFileData ? { ZipFile: zipFileData } : undefined,
      Architectures: [createForm.value.architecture],
      Environment: environment,
    })
    toast.success('Function created successfully')
    showCreateModal.value = false
    createForm.value = {
      functionName: '',
      runtime: 'nodejs22.x',
      handler: 'index.handler',
      memory: 128,
      timeout: 30,
      roleArn: DEFAULT_ROLE_ARN,
      zipFile: null,
      architecture: 'amd64',
      environment: '',
    }
    loadFunctions()
  } catch (error) {
    console.error('Error creating function:', error)
    toast.error('Failed to create function')
  } finally {
    creating.value = false
  }
}

function openInvokeModal(func: LambdaFunction) {
  selectedFunction.value = func
  invokeForm.value = {
    payload: '{}',
    invocationType: 'RequestResponse',
  }
  invokeResult.value = ''
  showInvokeModal.value = true
}

async function invokeFunction() {
  invokeResult.value = ''
  try {
    let payload: unknown
    try {
      payload = JSON.parse(invokeForm.value.payload)
    } catch {
      payload = invokeForm.value.payload
    }

    const response = await lambda.invoke(
      selectedFunction.value.FunctionName,
      payload,
      {
        invocationType: invokeForm.value.invocationType as 'RequestResponse' | 'Event' | 'DryRun',
      }
    )
    invokeResult.value = response?.payload || response?.Payload || 'Success (no output)'
  } catch (error) {
    console.error('Error invoking function:', error)
    invokeResult.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    invokeLoading.value = false
  }
}

function openEditModal(func: LambdaFunction) {
  selectedFunction.value = func
  editForm.value = {
    memory: func.MemorySize || 128,
    timeout: func.Timeout || 30,
  }
  showEditModal.value = true
}

async function updateFunctionConfiguration() {
  if (!selectedFunction.value) return

  updating.value = true
  try {
    await lambda.updateFunctionConfiguration(
      selectedFunction.value.FunctionName,
      {
        MemorySize: editForm.value.memory,
        Timeout: editForm.value.timeout,
      }
    )
    toast.success('Function configuration updated')
    showEditModal.value = false
    loadFunctions()
  } catch (error) {
    console.error('Error updating function:', error)
    toast.error('Failed to update function configuration')
  } finally {
    updating.value = false
  }
}

function openDeleteModal(func: LambdaFunction) {
  selectedFunction.value = func
  showDeleteModal.value = true
}

async function deleteFunction() {
  if (!selectedFunction.value) return

  try {
    await lambda.deleteFunction(selectedFunction.value.FunctionName)
    toast.success('Function deleted successfully')
    showDeleteModal.value = false
    selectedFunction.value = null
    loadFunctions()
  } catch (error) {
    console.error('Error deleting function:', error)
    toast.error('Failed to delete function')
  }
}

function openDetailsModal(func: LambdaFunction) {
  selectedFunction.value = func
  showDetailsModal.value = true
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

onMounted(() => {
  loadFunctions()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Lambda Functions
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ functions.length }} function{{ functions.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="primary"
            @click="showCreateModal = true"
          >
            <template #icon>
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </template>
            Create Function
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex items-center justify-center py-12"
      >
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="functions.length === 0"
        icon="function"
        title="No Lambda Functions"
        description="Create your first Lambda function to get started."
        action-label="Create Function"
        @action="showCreateModal = true"
      />

      <!-- Functions Table -->
      <DataTable
        v-else
        :columns="columns"
        :data="functions"
        :loading="loading"
        empty-title="No Lambda Functions"
        empty-text="No Lambda functions found."
      >
        <template #cell-FunctionName="{ value, row }">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
          </div>
        </template>

        <template #cell-Runtime="{ value }">
          <StatusBadge
            status="active"
            :label="value || '-'"
          />
        </template>

        <template #cell-MemorySize="{ value }">
          <span class="text-light-text dark:text-dark-text">{{ value }}MB</span>
        </template>

        <template #cell-Timeout="{ value }">
          <span class="text-light-text dark:text-dark-text">{{ value }}s</span>
        </template>

        <template #cell-LastModified="{ value }">
          <span class="text-light-muted dark:text-dark-muted">{{ formatDate(value) }}</span>
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openDetailsModal(row)"
            >
              View
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openInvokeModal(row)"
            >
              Invoke
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openEditModal(row)"
            >
              Edit
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              @click="openDeleteModal(row)"
            >
              Delete
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Usage Examples -->
      <div class="mt-6">
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

    <!-- Create Function Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create Lambda Function"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="createForm.functionName"
          label="Function Name"
          placeholder="my-function"
          required
        />
        <FormSelect
          v-model="createForm.runtime"
          label="Runtime"
          :options="runtimeOptions"
        />
        <FormInput
          v-model="createForm.handler"
          label="Handler"
          placeholder="index.handler"
        />
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Memory: {{ createForm.memory }}MB
          </label>
          <input
            v-model.number="createForm.memory"
            type="range"
            min="128"
            max="1024"
            step="64"
            class="w-full"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Timeout: {{ createForm.timeout }}s
          </label>
          <input
            v-model.number="createForm.timeout"
            type="range"
            min="3"
            max="900"
            step="1"
            class="w-full"
          >
        </div>
        <FormInput
          v-model="createForm.roleArn"
          label="Role ARN"
          placeholder="arn:aws:iam::123456789012:role/test"
        />
        <FormSelect
          v-model="createForm.architecture"
          label="Architecture"
          :options="architectureOptions"
        />
        <FormInput
          v-model="createForm.environment"
          label="Environment (optional)"
          placeholder="{&quot;KEY&quot;: &quot;value&quot;}"
        />
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            ZIP File (optional)
          </label>
          <input
            type="file"
            accept=".zip"
            class="w-full text-sm text-light-text dark:text-dark-text
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              file:cursor-pointer
              hover:file:bg-primary-dark"
            @change="handleZipFileChange"
          >
          <p
            v-if="createForm.zipFile"
            class="mt-1 text-xs text-light-muted dark:text-dark-muted"
          >
            Selected: {{ createForm.zipFile.name }} ({{ (createForm.zipFile.size / 1024).toFixed(1) }} KB)
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createFunction"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Invoke Function Modal -->
    <Modal
      v-model:open="showInvokeModal"
      :title="`Invoke: ${selectedFunction?.FunctionName || ''}`"
      size="lg"
    >
      <div class="space-y-4">
        <FormSelect
          v-model="invokeForm.invocationType"
          label="Invocation Type"
          :options="invocationTypes"
        />
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Payload (JSON)
          </label>
          <textarea
            v-model="invokeForm.payload"
            rows="6"
            class="w-full px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text font-mono text-sm"
            placeholder="{&quot;key&quot;: &quot;value&quot;}"
          />
        </div>
        <div v-if="invokeResult">
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Response
          </label>
          <pre class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg text-sm font-mono overflow-auto max-h-64 text-light-text dark:text-dark-text">{{ invokeResult }}</pre>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showInvokeModal = false"
          >
            Close
          </Button>
          <Button
            :loading="invokeLoading"
            @click="invokeFunction"
          >
            Invoke
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Edit Function Modal -->
    <Modal
      v-model:open="showEditModal"
      :title="`Edit: ${selectedFunction?.FunctionName || ''}`"
      size="md"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Memory: {{ editForm.memory }}MB
          </label>
          <input
            v-model.number="editForm.memory"
            type="range"
            min="128"
            max="1024"
            step="64"
            class="w-full"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Timeout: {{ editForm.timeout }}s
          </label>
          <input
            v-model.number="editForm.timeout"
            type="range"
            min="3"
            max="900"
            step="1"
            class="w-full"
          >
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="updating"
            @click="updateFunctionConfiguration"
          >
            Update
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Function Modal -->
    <Modal
      v-model:open="showDeleteModal"
      title="Delete Lambda Function"
      size="md"
    >
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          <svg
            class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="text-sm text-red-800 dark:text-red-200">
              Are you sure you want to delete the function "{{ selectedFunction?.FunctionName }}"?
            </p>
            <p class="text-xs text-red-700 dark:text-red-300 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="deleteFunction"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Function Details Modal -->
    <Modal
      v-model:open="showDetailsModal"
      :title="selectedFunction?.FunctionName || 'Function Details'"
      size="lg"
    >
      <div
        v-if="selectedFunction"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Runtime</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedFunction.Runtime }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Handler</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedFunction.Handler }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Memory</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedFunction.MemorySize }}MB
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Timeout</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedFunction.Timeout }}s
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Last Modified</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ formatDate(selectedFunction.LastModified) }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono truncate">
              {{ selectedFunction.FunctionArn }}
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showDetailsModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>
  </div>
</template>
