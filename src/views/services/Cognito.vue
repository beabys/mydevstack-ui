<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import * as cognito from '@/api/services/cognito'
import type { CognitoUserPool, CognitoUser } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const userPools = ref<CognitoUserPool[]>([])
const users = ref<CognitoUser[]>([])
const clients = ref<any[]>([])
const loading = ref(false)
const loadingUsers = ref(false)
const loadingClients = ref(false)
const selectedPool = ref<CognitoUserPool | null>(null)
const selectedUser = ref<CognitoUser | null>(null)
const showExamples = ref(false)

// Modal state
const showCreatePoolModal = ref(false)
const showCreateUserModal = ref(false)
const showEditPoolModal = ref(false)
const showEditUserModal = ref(false)
const showClientsModal = ref(false)
const showCreateClientModal = ref(false)
const showUsersModal = ref(false)
const showUserDetailsModal = ref(false)
const showDeletePoolModal = ref(false)
const showDeleteUserModal = ref(false)
const poolToDelete = ref<CognitoUserPool | null>(null)
const userToDelete = ref<CognitoUser | null>(null)

// Form state
const newPoolName = ref('')
const editPoolForm = ref({
  name: '',
})
const newUserForm = ref({
  username: '',
  email: '',
  phone: '',
  temporaryPassword: '',
  sendInvitation: true,
})
const editUserForm = ref({
  email: '',
  phone: '',
})

const creatingPool = ref(false)
const creatingUser = ref(false)
const updatingPool = ref(false)
const updatingUser = ref(false)
const creatingClient = ref(false)

// Columns
const poolColumns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'Id', label: 'ID', sortable: false },
  { key: 'Status', label: 'Status', sortable: true },
  { key: 'CreationDate', label: 'Created', sortable: true },
])

const userColumns = computed(() => [
  { key: 'Username', label: 'Username', sortable: true },
  { key: 'Email', label: 'Email', sortable: true },
  { key: 'PhoneNumber', label: 'Phone', sortable: true },
  { key: 'UserStatus', label: 'Status', sortable: true },
  { key: 'Enabled', label: 'Enabled', sortable: true },
])

const clientColumns = computed(() => [
  { key: 'ClientName', label: 'Client Name', sortable: true },
  { key: 'ClientId', label: 'Client ID', sortable: false },
  { key: 'CreationDate', label: 'Created', sortable: true },
])

// Code examples
const selectedExample = ref(0)
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List Cognito user pools
aws cognito-idp list-user-pools --max-results 20 --endpoint-url ${settingsStore.endpoint}

# Create user pool
aws cognito-idp create-user-pool \\
  --pool-name my-user-pool \\
  --endpoint-url ${settingsStore.endpoint}

# Describe user pool
aws cognito-idp describe-user-pool \\
  --user-pool-id us-east-1_xxxxx \\
  --endpoint-url ${settingsStore.endpoint}

# Update user pool
aws cognito-idp update-user-pool \\
  --user-pool-id us-east-1_xxxxx \\
  --mfa-configuration OFF \\
  --endpoint-url ${settingsStore.endpoint}

# Create user (admin)
aws cognito-idp admin-create-user \\
  --user-pool-id us-east-1_xxxxx \\
  --username johndoe \\
  --user-attributes Name=email,Value=john@example.com \\
  --temporary-password TempPass123! \\
  --endpoint-url ${settingsStore.endpoint}

# Admin list users
aws cognito-idp admin-list-users \\
  --user-pool-id us-east-1_xxxxx \\
  --endpoint-url ${settingsStore.endpoint}

# Admin enable/disable user
aws cognito-idp admin-enable-user \\
  --user-pool-id us-east-1_xxxxx \\
  --username johndoe \\
  --endpoint-url ${settingsStore.endpoint}

aws cognito-idp admin-disable-user \\
  --user-pool-id us-east-1_xxxxx \\
  --username johndoe \\
  --endpoint-url ${settingsStore.endpoint}

# Admin delete user
aws cognito-idp admin-delete-user \\
  --user-pool-id us-east-1_xxxxx \\
  --username johndoe \\
  --endpoint-url ${settingsStore.endpoint}

# Delete user pool
aws cognito-idp delete-user-pool \\
  --user-pool-id us-east-1_xxxxx \\
  --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { CognitoIdentityProviderClient, ListUserPoolsCommand, CreateUserPoolCommand, AdminCreateUserCommand, AdminListUsersCommand, AdminDeleteUserCommand, AdminEnableUserCommand, AdminDisableUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List user pools
const pools = await client.send(new ListUserPoolsCommand({ MaxResults: 20 }));
console.log(pools.UserPools);

// Create user pool
const pool = await client.send(new CreateUserPoolCommand({
  PoolName: 'my-user-pool',
}));
console.log(pool.UserPool);

// Admin create user
await client.send(new AdminCreateUserCommand({
  UserPoolId: 'us-east-1_xxxxx',
  Username: 'johndoe',
  UserAttributes: [
    { Name: 'email', Value: 'john@example.com' },
  ],
  TemporaryPassword: 'TempPass123!',
}));

// Admin list users
const users = await client.send(new AdminListUsersCommand({
  UserPoolId: 'us-east-1_xxxxx',
}));
console.log(users.Users);

// Admin enable user
await client.send(new AdminEnableUserCommand({
  UserPoolId: 'us-east-1_xxxxx',
  Username: 'johndoe',
}));

// Admin disable user
await client.send(new AdminDisableUserCommand({
  UserPoolId: 'us-east-1_xxxxx',
  Username: 'johndoe',
}));

// Admin delete user
await client.send(new AdminDeleteUserCommand({
  UserPoolId: 'us-east-1_xxxxx',
  Username: 'johndoe',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'cognito-idp',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List user pools
response = client.list_user_pools(MaxResults=20)
for pool in response['UserPools']:
    print(pool['Name'], pool['Id'])

# Create user pool
response = client.create_user_pool(PoolName='my-user-pool')
print(response['UserPool'])

# Admin create user
client.admin_create_user(
    UserPoolId='us-east-1_xxxxx',
    Username='johndoe',
    UserAttributes=[
        {'Name': 'email', 'Value': 'john@example.com'},
    ],
    TemporaryPassword='TempPass123!',
)

# Admin list users
response = client.admin_list_users(UserPoolId='us-east-1_xxxxx')
for user in response['Users']:
    print(user['Username'], user['UserStatus'])

# Admin enable/disable user
client.admin_enable_user(UserPoolId='us-east-1_xxxxx', Username='johndoe')
client.admin_disable_user(UserPoolId='us-east-1_xxxxx', Username='johndoe')

# Admin delete user
client.admin_delete_user(UserPoolId='us-east-1_xxxxx', Username='johndoe')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := cognitoidentityprovider.NewFromConfig(cfg, func(o *cognitoidentityprovider.Options) {
    o.BaseURL = aws.String("${settingsStore.endpoint}")
})

// List user pools
pools, _ := client.ListUserPools(context.Background(), &cognitoidentityprovider.ListUserPoolsInput{
    MaxResults: aws.Int32(20),
})
fmt.Println(pools.UserPools)

// Create user pool
pool, _ := client.CreateUserPool(context.Background(), &cognitoidentityprovider.CreateUserPoolInput{
    PoolName: aws.String("my-user-pool"),
})
fmt.Println(pool.UserPool)

// Admin create user
_, _ = client.AdminCreateUser(context.Background(), &cognitoidentityprovider.AdminCreateUserInput{
    UserPoolId:        aws.String("us-east-1_xxxxx"),
    Username:          aws.String("johndoe"),
    UserAttributes: []types.AttributeType{
        {Name: aws.String("email"), Value: aws.String("john@example.com")},
    },
    TemporaryPassword: aws.String("TempPass123!"),
})

// Admin list users
users, _ := client.AdminListUsers(context.Background(), &cognitoidentityprovider.AdminListUsersInput{
    UserPoolId: aws.String("us-east-1_xxxxx"),
})
fmt.Println(users.Users)

// Admin enable user
_, _ = client.AdminEnableUser(context.Background(), &cognitoidentityprovider.AdminEnableUserInput{
    UserPoolId: aws.String("us-east-1_xxxxx"),
    Username:   aws.String("johndoe"),
})

// Admin delete user
_, _ = client.AdminDeleteUser(context.Background(), &cognitoidentityprovider.AdminDeleteUserInput{
    UserPoolId: aws.String("us-east-1_xxxxx"),
    Username:   aws.String("johndoe"),
})`
  },
])

// Load user pools
async function loadUserPools() {
  loading.value = true
  try {
    const response = await cognito.listUserPools()
    userPools.value = response.UserPools || []
  } catch (error) {
    console.error('Error loading user pools:', error)
    toast.error('Failed to load user pools')
  } finally {
    loading.value = false
  }
}

// Load users for selected pool
async function loadUsers(pool: CognitoUserPool) {
  selectedPool.value = pool
  loadingUsers.value = true
  showUsersModal.value = true
  try {
    const response = await cognito.adminListUsers({ UserPoolId: pool.Id })
    users.value = response.Users || []
  } catch (error) {
    console.error('Error loading users:', error)
    toast.error('Failed to load users')
  } finally {
    loadingUsers.value = false
  }
}

// Load clients for selected pool
async function loadClients(pool: CognitoUserPool) {
  selectedPool.value = pool
  loadingClients.value = true
  showClientsModal.value = true
  try {
    const response = await cognito.listUserPoolClients({ UserPoolId: pool.Id })
    clients.value = response.UserPoolClients || []
  } catch (error) {
    console.error('Error loading clients:', error)
    toast.error('Failed to load clients')
  } finally {
    loadingClients.value = false
  }
}

// Create user pool
async function createUserPool() {
  if (!newPoolName.value) {
    toast.error('User pool name is required')
    return
  }

  creatingPool.value = true
  try {
    await cognito.createUserPool({ PoolName: newPoolName.value })
    toast.success('User pool created successfully')
    showCreatePoolModal.value = false
    newPoolName.value = ''
    loadUserPools()
  } catch (error) {
    console.error('Error creating user pool:', error)
    toast.error('Failed to create user pool')
  } finally {
    creatingPool.value = false
  }
}

// Edit user pool
function openEditPoolModal(pool: CognitoUserPool) {
  selectedPool.value = pool
  editPoolForm.value = {
    name: pool.Name || '',
  }
  showEditPoolModal.value = true
}

async function updateUserPool() {
  if (!selectedPool.value) return

  updatingPool.value = true
  try {
    await cognito.updateUserPool({
      UserPoolId: selectedPool.value.Id,
    })
    toast.success('User pool updated successfully')
    showEditPoolModal.value = false
    loadUserPools()
  } catch (error) {
    console.error('Error updating user pool:', error)
    toast.error('Failed to update user pool')
  } finally {
    updatingPool.value = false
  }
}

// Create user
async function createUser() {
  if (!selectedPool.value || !newUserForm.value.username) {
    toast.error('Username is required')
    return
  }

  creatingUser.value = true
  try {
    const userAttributes = []
    if (newUserForm.value.email) {
      userAttributes.push({ Name: 'email', Value: newUserForm.value.email })
      userAttributes.push({ Name: 'email_verified', Value: 'true' })
    }
    if (newUserForm.value.phone) {
      userAttributes.push({ Name: 'phone_number', Value: newUserForm.value.phone })
      userAttributes.push({ Name: 'phone_number_verified', Value: 'true' })
    }

    await cognito.adminCreateUser({
      UserPoolId: selectedPool.value.Id,
      Username: newUserForm.value.username,
      UserAttributes: userAttributes,
      TemporaryPassword: newUserForm.value.temporaryPassword || undefined,
      MessageAction: newUserForm.value.sendInvitation ? undefined : 'SUPPRESS',
    })
    toast.success('User created successfully')
    showCreateUserModal.value = false
    newUserForm.value = {
      username: '',
      email: '',
      phone: '',
      temporaryPassword: '',
      sendInvitation: true,
    }
    loadUsers(selectedPool.value)
  } catch (error) {
    console.error('Error creating user:', error)
    toast.error('Failed to create user')
  } finally {
    creatingUser.value = false
  }
}

// Edit user
function openEditUserModal(user: CognitoUser) {
  selectedUser.value = user
  const emailAttr = user.UserAttributes?.find((a: any) => a.Name === 'email')
  const phoneAttr = user.UserAttributes?.find((a: any) => a.Name === 'phone_number')
  editUserForm.value = {
    email: emailAttr?.Value || '',
    phone: phoneAttr?.Value || '',
  }
  showEditUserModal.value = true
}

async function updateUser() {
  if (!selectedPool.value || !selectedUser.value) return

  updatingUser.value = true
  try {
    const userAttributes = []
    if (editUserForm.value.email) {
      userAttributes.push({ Name: 'email', Value: editUserForm.value.email })
    }
    if (editUserForm.value.phone) {
      userAttributes.push({ Name: 'phone_number', Value: editUserForm.value.phone })
    }

    if (userAttributes.length > 0) {
      await cognito.adminUpdateUserAttributes({
        UserPoolId: selectedPool.value.Id,
        Username: selectedUser.value.Username,
        UserAttributes: userAttributes,
      })
    }
    toast.success('User attributes updated')
    showEditUserModal.value = false
    loadUsers(selectedPool.value)
  } catch (error) {
    console.error('Error updating user:', error)
    toast.error('Failed to update user')
  } finally {
    updatingUser.value = false
  }
}

// View user details
function viewUserDetails(user: CognitoUser) {
  selectedUser.value = user
  showUserDetailsModal.value = true
}

// Create app client
async function createClient() {
  if (!selectedPool.value || !newClientName.value) {
    toast.error('Client name is required')
    return
  }

  creatingClient.value = true
  try {
    await cognito.createUserPoolClient({
      UserPoolId: selectedPool.value.Id,
      ClientName: newClientName.value,
      GenerateSecret: false,
    })
    toast.success('App client created successfully')
    showCreateClientModal.value = false
    newClientName.value = ''
    loadClients(selectedPool.value)
  } catch (error) {
    console.error('Error creating client:', error)
    toast.error('Failed to create app client')
  } finally {
    creatingClient.value = false
  }
}

// Open delete pool modal
function openDeletePoolModal(pool: CognitoUserPool) {
  poolToDelete.value = pool
  showDeletePoolModal.value = true
}

// Delete user pool
async function confirmDeletePool() {
  if (!poolToDelete.value) return

  try {
    await cognito.deleteUserPool(poolToDelete.value.Id)
    toast.success('User pool deleted successfully')
    showDeletePoolModal.value = false
    poolToDelete.value = null
    loadUserPools()
  } catch (error) {
    console.error('Error deleting user pool:', error)
    toast.error('Failed to delete user pool')
  }
}

// Disable user
async function disableUser(user: CognitoUser) {
  if (!selectedPool.value) return

  try {
    await cognito.adminDisableUser({
      UserPoolId: selectedPool.value.Id,
      Username: user.Username,
    })
    toast.success('User disabled successfully')
    loadUsers(selectedPool.value)
  } catch (error) {
    console.error('Error disabling user:', error)
    toast.error('Failed to disable user')
  }
}

// Enable user
async function enableUser(user: CognitoUser) {
  if (!selectedPool.value) return

  try {
    await cognito.adminEnableUser({
      UserPoolId: selectedPool.value.Id,
      Username: user.Username,
    })
    toast.success('User enabled successfully')
    loadUsers(selectedPool.value)
  } catch (error) {
    console.error('Error enabling user:', error)
    toast.error('Failed to enable user')
  }
}

// Open delete user modal
function openDeleteUserModal(user: CognitoUser) {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

// Delete user
async function confirmDeleteUser() {
  if (!selectedPool.value || !userToDelete.value) return

  try {
    await cognito.adminDeleteUser({
      UserPoolId: selectedPool.value.Id,
      Username: userToDelete.value.Username,
    })
    toast.success('User deleted successfully')
    showDeleteUserModal.value = false
    userToDelete.value = null
    loadUsers(selectedPool.value)
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user')
  }
}

// Get user status type
function getUserStatusType(status: string): 'active' | 'inactive' | 'pending' | 'error' | 'warning' | 'success' {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'UNCONFIRMED': return 'warning'
    case 'RESET_REQUIRED': return 'error'
    default: return 'inactive'
  }
}

// Get user email from attributes
function getUserEmail(user: CognitoUser): string {
  const emailAttr = user.UserAttributes?.find((a: any) => a.Name === 'email')
  return emailAttr?.Value || '-'
}

// Get user phone from attributes
function getUserPhone(user: CognitoUser): string {
  const phoneAttr = user.UserAttributes?.find((a: any) => a.Name === 'phone_number')
  return phoneAttr?.Value || '-'
}

// Copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

// New client name
const newClientName = ref('')

onMounted(() => {
  loadUserPools()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Cognito
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ userPools.length }} pool{{ userPools.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="primary" @click="showCreatePoolModal = true">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Create User Pool
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Usage Examples -->
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-4" :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'">
          Usage Examples
        </h2>
        <div class="rounded-lg border overflow-hidden" :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'">
          <div class="flex border-b" :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'">
            <button
              v-for="(example, index) in codeExamples"
              :key="example.language"
              @click="selectedExample = index"
              class="px-4 py-2 text-sm font-medium transition-colors"
              :class="[
                selectedExample === index
                  ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              ]"
            >
              {{ example.label }}
            </button>
          </div>
          <div class="p-4 overflow-x-auto">
            <pre class="text-sm font-mono" :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'">{{ codeExamples[selectedExample].code }}</pre>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="userPools.length === 0"
        icon="users"
        title="No User Pools"
        description="Create your first user pool to get started."
        action-label="Create User Pool"
        @action="showCreatePoolModal = true"
      />

      <!-- User Pools Table -->
      <DataTable
        v-else
        :columns="poolColumns"
        :data="userPools"
        :loading="loading"
        empty-title="No User Pools"
        empty-text="No user pools found."
      >
        <template #cell-Name="{ value }">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
          </div>
        </template>

        <template #cell-Id="{ value }">
          <div class="flex items-center gap-2">
            <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
            <button
              class="text-light-muted dark:text-dark-muted hover:text-primary-500"
              @click="copyToClipboard(value)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </template>

        <template #cell-Status="{ value }">
          <StatusBadge :status="value === 'Enabled' ? 'active' : 'inactive'" />
        </template>

        <template #cell-CreationDate="{ value }">
          <span class="text-light-muted dark:text-dark-muted">{{ new Date(value).toLocaleDateString() }}</span>
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadUsers(row)"
            >
              Users
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadClients(row)"
            >
              Clients
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openEditPoolModal(row)"
            >
              Edit
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              @click="openDeletePoolModal(row)"
            >
              Delete
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Users Modal -->
    <Modal
      v-model:open="showUsersModal"
      :title="`Users: ${selectedPool?.Name || ''}`"
      size="xl"
    >
      <div class="flex justify-end mb-4">
        <Button size="sm" @click="showCreateUserModal = true">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Create User
        </Button>
      </div>

      <div v-if="loadingUsers" class="flex justify-center py-8">
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="users.length === 0"
        icon="users"
        title="No Users"
        description="No users found in this user pool."
        @action="showCreateUserModal = true"
      />

      <DataTable
        v-else
        :columns="userColumns"
        :data="users"
        empty-title="No Users"
        empty-text="No users found."
      >
        <template #cell-Username="{ value, row }">
          <button class="font-medium text-primary-500 hover:underline" @click="viewUserDetails(row)">
            {{ value }}
          </button>
        </template>

        <template #cell-Email="{ row }">
          <span class="text-light-text dark:text-dark-text">{{ getUserEmail(row) }}</span>
        </template>

        <template #cell-PhoneNumber="{ row }">
          <span class="text-light-text dark:text-dark-text">{{ getUserPhone(row) }}</span>
        </template>

        <template #cell-UserStatus="{ value }">
          <StatusBadge :status="getUserStatusType(value)" :label="value" />
        </template>

        <template #cell-Enabled="{ value }">
          <StatusBadge :status="value ? 'active' : 'inactive'" :label="value ? 'Enabled' : 'Disabled'" />
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openEditUserModal(row)"
            >
              Edit
            </button>
            <button
              v-if="row.Enabled"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="disableUser(row)"
            >
              Disable
            </button>
            <button
              v-else
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="enableUser(row)"
            >
              Enable
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              @click="openDeleteUserModal(row)"
            >
              Delete
            </button>
          </div>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showUsersModal = false">Close</Button>
        </div>
      </template>
    </Modal>

    <!-- Clients Modal -->
    <Modal
      v-model:open="showClientsModal"
      :title="`App Clients: ${selectedPool?.Name || ''}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button size="sm" @click="showCreateClientModal = true">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Create Client
        </Button>
      </div>

      <div v-if="loadingClients" class="flex justify-center py-8">
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="clients.length === 0"
        icon="key"
        title="No App Clients"
        description="No app clients found for this user pool."
        @action="showCreateClientModal = true"
      />

      <DataTable
        v-else
        :columns="clientColumns"
        :data="clients"
        empty-title="No App Clients"
        empty-text="No clients found."
      >
        <template #cell-ClientName="{ value }">
          <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
        </template>

        <template #cell-ClientId="{ value }">
          <div class="flex items-center gap-2">
            <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
            <button
              class="text-light-muted dark:text-dark-muted hover:text-primary-500"
              @click="copyToClipboard(value)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </template>

        <template #cell-CreationDate="{ value }">
          <span class="text-light-muted dark:text-dark-muted">{{ new Date(value).toLocaleDateString() }}</span>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showClientsModal = false">Close</Button>
        </div>
      </template>
    </Modal>

    <!-- Create User Pool Modal -->
    <Modal
      v-model:open="showCreatePoolModal"
      title="Create User Pool"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newPoolName"
          label="User Pool Name"
          placeholder="my-user-pool"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showCreatePoolModal = false">Cancel</Button>
          <Button :loading="creatingPool" @click="createUserPool">Create</Button>
        </div>
      </template>
    </Modal>

    <!-- Edit User Pool Modal -->
    <Modal
      v-model:open="showEditPoolModal"
      :title="`Edit: ${selectedPool?.Name || ''}`"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editPoolForm.name"
          label="Pool Name"
          placeholder="my-user-pool"
        />
        <p class="text-sm text-light-muted dark:text-dark-muted">
          Additional pool configuration options can be modified via API.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showEditPoolModal = false">Cancel</Button>
          <Button :loading="updatingPool" @click="updateUserPool">Save</Button>
        </div>
      </template>
    </Modal>

    <!-- Create User Modal -->
    <Modal
      v-model:open="showCreateUserModal"
      title="Create User"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newUserForm.username"
          label="Username"
          placeholder="johndoe"
          required
        />
        <FormInput
          v-model="newUserForm.email"
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        <FormInput
          v-model="newUserForm.phone"
          label="Phone Number"
          placeholder="+1234567890"
        />
        <FormInput
          v-model="newUserForm.temporaryPassword"
          label="Temporary Password"
          type="password"
          placeholder="TempPass123!"
        />
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="newUserForm.sendInvitation"
            id="sendInvitation"
            class="rounded border-light-border dark:border-dark-border"
          />
          <label for="sendInvitation" class="text-sm text-light-text dark:text-dark-text">
            Send invitation email
          </label>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showCreateUserModal = false">Cancel</Button>
          <Button :loading="creatingUser" @click="createUser">Create</Button>
        </div>
      </template>
    </Modal>

    <!-- Edit User Modal -->
    <Modal
      v-model:open="showEditUserModal"
      :title="`Edit User: ${selectedUser?.Username || ''}`"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editUserForm.email"
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        <FormInput
          v-model="editUserForm.phone"
          label="Phone Number"
          placeholder="+1234567890"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showEditUserModal = false">Cancel</Button>
          <Button :loading="updatingUser" @click="updateUser">Save</Button>
        </div>
      </template>
    </Modal>

    <!-- User Details Modal -->
    <Modal
      v-model:open="showUserDetailsModal"
      :title="`User: ${selectedUser?.Username || ''}`"
      size="lg"
    >
      <div v-if="selectedUser" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Username</label>
            <p class="text-sm text-light-text dark:text-dark-text">{{ selectedUser.Username }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Status</label>
            <StatusBadge :status="getUserStatusType(selectedUser.UserStatus || '')" :label="selectedUser.UserStatus || ''" />
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Enabled</label>
            <StatusBadge :status="selectedUser.Enabled ? 'active' : 'inactive'" :label="selectedUser.Enabled ? 'Enabled' : 'Disabled'" />
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
            <p class="text-sm text-light-text dark:text-dark-text">{{ selectedUser.UserCreateDate ? new Date(selectedUser.UserCreateDate).toLocaleString() : '-' }}</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Attributes</label>
          <div class="space-y-2">
            <div v-for="attr in selectedUser.UserAttributes" :key="attr.Name" class="flex justify-between p-2 rounded bg-light-bg dark:bg-dark-bg">
              <span class="text-sm text-light-muted dark:text-dark-muted">{{ attr.Name }}</span>
              <span class="text-sm text-light-text dark:text-dark-text font-mono">{{ attr.Value }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showUserDetailsModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Create App Client Modal -->
    <Modal
      v-model:open="showCreateClientModal"
      title="Create App Client"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newClientName"
          label="Client Name"
          placeholder="my-app-client"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showCreateClientModal = false">Cancel</Button>
          <Button :loading="creatingClient" @click="createClient">Create</Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Pool Confirmation Modal -->
    <Modal
      v-model:open="showDeletePoolModal"
      title="Delete User Pool"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the user pool <strong>"{{ poolToDelete?.Name }}"</strong>?
          This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showDeletePoolModal = false">Cancel</Button>
          <Button variant="danger" @click="confirmDeletePool">Delete</Button>
        </div>
      </template>
    </Modal>

    <!-- Delete User Confirmation Modal -->
    <Modal
      v-model:open="showDeleteUserModal"
      title="Delete User"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the user <strong>"{{ userToDelete?.Username }}"</strong>?
          This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showDeleteUserModal = false">Cancel</Button>
          <Button variant="danger" @click="confirmDeleteUser">Delete</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
