<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ServerIcon,
  CircleStackIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()

// Types
interface RDSInstance {
  DBInstanceIdentifier: string
  DBInstanceClass: string
  Engine: string
  EngineVersion: string
  DBInstanceStatus: string
  MasterUsername: string
  Endpoint?: { Address: string; Port: number }
  DBName?: string
  AllocatedStorage: number
  StorageType: string
  InstanceCreateTime?: string
  AvailabilityZone?: string
  MultiAZ: boolean
  PubliclyAccessible: boolean
}

interface Database {
  name: string
  type: string
}

// State
const loading = ref(false)
const instances = ref<RDSInstance[]>([])
const selectedInstance = ref<RDSInstance | null>(null)
const databases = ref<Database[]>([])
const showCreateModal = ref(false)
const creating = ref(false)

// Create form state
const newInstanceId = ref('')
const newDBEngine = ref('postgres')
const newDBVersion = ref('15.3')
const newDBPort = ref(5432)
const newMasterUsername = ref('postgres')
const newMasterPassword = ref('')
const newDBInstanceClass = ref('db.t3.micro')
const newAllocatedStorage = ref(20)

// Instance columns
const instanceColumns = computed(() => [
  { key: 'DBInstanceIdentifier', label: 'Instance ID', sortable: true },
  { key: 'DBInstanceClass', label: 'Instance Class', sortable: true },
  { key: 'Engine', label: 'Engine', sortable: true },
  { key: 'EngineVersion', label: 'Version', sortable: true },
  { key: 'DBInstanceStatus', label: 'Status', sortable: true },
  { key: 'Endpoint', label: 'Endpoint', sortable: false },
])

// Database columns
const databaseColumns = computed(() => [
  { key: 'name', label: 'Database Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
])

// Helper functions
function getStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    available: 'active',
    creating: 'pending',
    running: 'active',
    deleting: 'pending',
    deleted: 'inactive',
    modified: 'pending',
    failed: 'error',
  }
  const lowerStatus = status.toLowerCase()
  return statusMap[lowerStatus] || 'inactive'
}

// API calls - RDS would need a dedicated service
async function loadInstances() {
  loading.value = true
  try {
    // In a real implementation, this would call the RDS API
    // For demonstration, using mock data
    instances.value = [
      {
        DBInstanceIdentifier: 'my-postgres-db',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'postgres',
        EngineVersion: '15.3',
        DBInstanceStatus: 'available',
        MasterUsername: 'postgres',
        Endpoint: { Address: 'my-postgres-db.xxxx.us-east-1.rds.amazonaws.com', Port: 5432 },
        DBName: 'mydb',
        AllocatedStorage: 20,
        StorageType: 'gp3',
        InstanceCreateTime: new Date().toISOString(),
        AvailabilityZone: 'us-east-1a',
        MultiAZ: false,
        PubliclyAccessible: false,
      },
    ]
    
    if (instances.value.length > 0 && !selectedInstance.value) {
      await selectInstance(instances.value[0])
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load instances: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectInstance(instance: RDSInstance) {
  selectedInstance.value = instance
  
  // Load databases for the instance
  databases.value = [
    { name: 'mydb', type: 'postgres' },
    { name: 'postgres', type: 'postgres' },
  ]
}

async function createInstance() {
  if (!newInstanceId.value || !newMasterPassword.value) {
    uiStore.notifyWarning('Validation', 'Instance ID and password are required')
    return
  }

  creating.value = true
  try {
    // In a real implementation, this would call the RDS API
    const newInstance: RDSInstance = {
      DBInstanceIdentifier: newInstanceId.value,
      DBInstanceClass: newDBInstanceClass.value,
      Engine: newDBEngine.value,
      EngineVersion: newDBVersion.value,
      DBInstanceStatus: 'creating',
      MasterUsername: newMasterUsername.value,
      Endpoint: { Address: `${newInstanceId.value}.xxxx.us-east-1.rds.amazonaws.com`, Port: newDBPort.value },
      AllocatedStorage: newAllocatedStorage.value,
      StorageType: 'gp3',
      InstanceCreateTime: new Date().toISOString(),
      MultiAZ: false,
      PubliclyAccessible: false,
    }
    
    instances.value.push(newInstance)
    uiStore.notifySuccess('Success', `Instance ${newInstanceId.value} is being created`)
    showCreateModal.value = false
    resetForm()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create instance: ${error}`)
  } finally {
    creating.value = false
  }
}

async function deleteInstance(instance: RDSInstance) {
  try {
    instances.value = instances.value.filter(i => i.DBInstanceIdentifier !== instance.DBInstanceIdentifier)
    if (selectedInstance.value?.DBInstanceIdentifier === instance.DBInstanceIdentifier) {
      selectedInstance.value = null
      databases.value = []
    }
    uiStore.notifySuccess('Success', `Instance ${instance.DBInstanceIdentifier} is being deleted`)
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete instance: ${error}`)
  }
}

function resetForm() {
  newInstanceId.value = ''
  newDBEngine.value = 'postgres'
  newDBVersion.value = '15.3'
  newDBPort.value = 5432
  newMasterUsername.value = 'postgres'
  newMasterPassword.value = ''
  newDBInstanceClass.value = 'db.t3.micro'
  newAllocatedStorage.value = 20
}

// Lifecycle
onMounted(() => {
  loadInstances()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div 
      class="p-4 border-b flex items-center justify-between"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <div class="flex items-center gap-3">
        <CircleStackIcon
          class="h-6 w-6"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        />
        <h1
          class="text-xl font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          RDS
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="loading"
          @click="loadInstances"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-1" />
          Create Instance
        </Button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State with Docker message -->
      <EmptyState
        v-if="!loading && instances.length === 0"
        icon="server"
        title="No RDS Instances"
        description="Launch MiniStack with Docker socket to manage RDS instances locally."
        action-label="Create Instance"
        @action="showCreateModal = true"
      >
        <template #action>
          <div class="space-y-4">
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Launch MiniStack with Docker socket to manage RDS instances locally.
            </p>
            <Button @click="showCreateModal = true">
              <PlusIcon class="h-4 w-4 mr-1" />
              Create Instance
            </Button>
          </div>
        </template>
      </EmptyState>
      
      <template v-else>
        <!-- Instance List -->
        <div class="mb-6">
          <h2
            class="text-lg font-medium mb-4"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            DB Instances
          </h2>
          
          <DataTable
            :columns="instanceColumns"
            :data="instances"
            :loading="loading"
            empty-title="No Instances"
            empty-text="No RDS instances found"
            @row-click="selectInstance"
          >
            <template #cell-DBInstanceIdentifier="{ value, row }">
              <div class="flex items-center gap-2">
                <ServerIcon class="h-4 w-4 text-primary-500" />
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
            
            <template #cell-DBInstanceStatus="{ value }">
              <StatusBadge
                :status="getStatus(value)"
                :label="value"
              />
            </template>
            
            <template #cell-Endpoint="{ value }">
              <code
                v-if="value"
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ value.Address }}:{{ value.Port }}
              </code>
              <span
                v-else
                class="text-light-muted dark:text-dark-muted"
              >-</span>
            </template>
            
            <template #row-actions="{ row }">
              <div class="flex items-center gap-2">
                <Button 
                  v-if="selectedInstance?.DBInstanceIdentifier !== row.DBInstanceIdentifier" 
                  variant="secondary" 
                  size="sm"
                  @click.stop="selectInstance(row)"
                >
                  View Details
                </Button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click.stop="deleteInstance(row)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
        
        <!-- Instance Details -->
        <div
          v-if="selectedInstance"
          class="space-y-6"
        >
          <div
            class="p-6 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <h3
              class="text-lg font-semibold mb-4"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Instance Details: {{ selectedInstance.DBInstanceIdentifier }}
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Status
                </p>
                <StatusBadge
                  :status="getStatus(selectedInstance.DBInstanceStatus)"
                  class="mt-1"
                />
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Instance Class
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.DBInstanceClass }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Engine
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.Engine }} {{ selectedInstance.EngineVersion }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Endpoint
                </p>
                <code
                  class="mt-1 text-xs block"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.Endpoint?.Address || '-' }}:{{ selectedInstance.Endpoint?.Port }}
                </code>
              </div>
            </div>
            
            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Storage
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.AllocatedStorage }} GB ({{ selectedInstance.StorageType }})
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Multi-AZ
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.MultiAZ ? 'Yes' : 'No' }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Publicly Accessible
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.PubliclyAccessible ? 'Yes' : 'No' }}
                </p>
              </div>
              <div>
                <p
                  class="text-sm"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >
                  Master Username
                </p>
                <p
                  class="mt-1 font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedInstance.MasterUsername }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Databases -->
          <div
            class="p-6 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <h3
              class="text-lg font-semibold mb-4"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Databases
            </h3>
            
            <DataTable
              :columns="databaseColumns"
              :data="databases"
              empty-title="No Databases"
              empty-text="No databases found"
            >
              <template #cell-name="{ value }">
                <span class="font-medium">{{ value }}</span>
              </template>
            </DataTable>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Instance Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create DB Instance"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newInstanceId"
          label="Instance Identifier"
          placeholder="my-db-instance"
          required
        />
        
        <FormSelect
          v-model="newDBEngine"
          label="Database Engine"
          :options="[
            { value: 'postgres', label: 'PostgreSQL' },
            { value: 'mysql', label: 'MySQL' },
            { value: 'mariadb', label: 'MariaDB' },
            { value: 'oracle-ee', label: 'Oracle' },
            { value: 'sqlserver-ex', label: 'SQL Server Express' },
          ]"
        />
        
        <FormSelect
          v-model="newDBVersion"
          label="Engine Version"
          :options="[
            { value: '15.3', label: 'PostgreSQL 15.3' },
            { value: '14.7', label: 'PostgreSQL 14.7' },
            { value: '8.0.32', label: 'MySQL 8.0.32' },
            { value: '10.21', label: 'MariaDB 10.21' },
          ]"
        />
        
        <FormInput
          v-model="newMasterUsername"
          label="Master Username"
          placeholder="postgres"
        />
        
        <FormInput
          v-model="newMasterPassword"
          label="Master Password"
          type="password"
          placeholder="Enter password"
          required
        />
        
        <FormSelect
          v-model="newDBInstanceClass"
          label="Instance Class"
          :options="[
            { value: 'db.t3.micro', label: 't3.micro (2 vCPU, 1 GB)' },
            { value: 'db.t3.small', label: 't3.small (2 vCPU, 2 GB)' },
            { value: 'db.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
            { value: 'db.m5.large', label: 'm5.large (2 vCPU, 8 GB)' },
          ]"
        />
        
        <FormInput
          v-model="newDBPort"
          label="Port"
          type="number"
          placeholder="5432"
        />
        
        <FormInput
          v-model="newAllocatedStorage"
          label="Allocated Storage (GB)"
          type="number"
          placeholder="20"
        />
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
            @click="createInstance"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
