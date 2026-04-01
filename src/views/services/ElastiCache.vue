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
import JsonViewer from '@/components/common/JsonViewer.vue'

// Stores
const settingsStore = useSettingsStore()
const uiStore = useUIStore()

// Types
interface ElastiCacheCluster {
  CacheClusterId: string
  CacheNodeType: string
  Engine: string
  EngineVersion: string
  CacheClusterStatus: string
  NumCacheNodes: number
  PreferredAvailabilityZone?: string
  CacheClusterCreateTime?: string
  CacheSecurityGroups?: Array<{ CacheSecurityGroupName: string; Status: string }>
  CacheSubnetGroupName?: string
  CacheParameterGroup?: { CacheParameterGroupName: string; ParameterApplyStatus: string }
  ReplicationGroupId?: string
  SnapshotRetentionDays?: number
  SnapshotWindow?: string
  AuthTokenEnabled?: boolean
  TransitEncryptionEnabled?: boolean
  AtRestEncryptionEnabled?: boolean
}

interface ElastiCacheNode {
  CacheNodeId: string
  CacheNodeStatus: string
  CacheNodeType: string
  Engine: string
  InstanceType?: string
  CacheNodeGroups?: Array<{ CacheNodeGroupName: string; CacheNodeGroupMembers?: Array<{ CacheNodeId: string; CacheClusterId: string; Role: string }> }>
}

interface ElastiCacheEndpoint {
  Address: string
  Port: number
}

// State
const loading = ref(false)
const clusters = ref<ElastiCacheCluster[]>([])
const selectedCluster = ref<ElastiCacheCluster | null>(null)
const clusterNodes = ref<ElastiCacheNode[]>([])
const showCreateModal = ref(false)
const creating = ref(false)

// Create form state
const newClusterId = ref('')
const newNodeType = ref('cache.t3.micro')
const newEngine = ref('redis')
const newEngineVersion = ref('7.0')
const newPort = ref(6379)
const newNumNodes = ref(1)

// Cluster columns
const clusterColumns = computed(() => [
  { key: 'CacheClusterId', label: 'Cluster ID', sortable: true },
  { key: 'CacheNodeType', label: 'Node Type', sortable: true },
  { key: 'Engine', label: 'Engine', sortable: true },
  { key: 'EngineVersion', label: 'Version', sortable: true },
  { key: 'CacheClusterStatus', label: 'Status', sortable: true },
  { key: 'NumCacheNodes', label: 'Nodes', sortable: true },
])

// Node columns
const nodeColumns = computed(() => [
  { key: 'CacheNodeId', label: 'Node ID', sortable: true },
  { key: 'CacheNodeStatus', label: 'Status', sortable: true },
  { key: 'CacheNodeType', label: 'Node Type', sortable: true },
])

// Helper functions
function getClusterStatus(status: string): 'active' | 'pending' | 'inactive' | 'error' {
  const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
    available: 'active',
    creating: 'pending',
    running: 'active',
    deleting: 'pending',
    deleted: 'inactive',
    modify: 'pending',
  }
  const lowerStatus = status.toLowerCase()
  return statusMap[lowerStatus] || 'inactive'
}

// API calls - ElastiCache would need a dedicated service
// For now, we'll create mock data for demonstration
async function loadClusters() {
  loading.value = true
  try {
    // In a real implementation, this would call the ElastiCache API
    // For now, we'll use mock data to show the UI
    clusters.value = [
      {
        CacheClusterId: 'my-redis-cluster',
        CacheNodeType: 'cache.t3.micro',
        Engine: 'redis',
        EngineVersion: '7.0',
        CacheClusterStatus: 'available',
        NumCacheNodes: 2,
        PreferredAvailabilityZone: 'us-east-1a',
        CacheClusterCreateTime: new Date().toISOString(),
      },
    ]
    
    if (clusters.value.length > 0 && !selectedCluster.value) {
      await selectCluster(clusters.value[0])
    }
  } catch (error) {
    uiStore.notifyError('Error', `Failed to load clusters: ${error}`)
  } finally {
    loading.value = false
  }
}

async function selectCluster(cluster: ElastiCacheCluster) {
  selectedCluster.value = cluster
  // Load nodes for the cluster
  clusterNodes.value = [
    {
      CacheNodeId: '0001',
      CacheNodeStatus: 'available',
      CacheNodeType: cluster.CacheNodeType,
      Engine: cluster.Engine,
    },
    {
      CacheNodeId: '0002',
      CacheNodeStatus: 'available',
      CacheNodeType: cluster.CacheNodeType,
      Engine: cluster.Engine,
    },
  ]
}

async function createCluster() {
  if (!newClusterId.value) {
    uiStore.notifyWarning('Validation', 'Cluster ID is required')
    return
  }

  creating.value = true
  try {
    // In a real implementation, this would call the ElastiCache API
    const newCluster: ElastiCacheCluster = {
      CacheClusterId: newClusterId.value,
      CacheNodeType: newNodeType.value,
      Engine: newEngine.value,
      EngineVersion: newEngineVersion.value,
      CacheClusterStatus: 'creating',
      NumCacheNodes: newNumNodes.value,
      CacheClusterCreateTime: new Date().toISOString(),
    }
    
    clusters.value.push(newCluster)
    uiStore.notifySuccess('Success', `Cluster ${newClusterId.value} is being created`)
    showCreateModal.value = false
    resetForm()
  } catch (error) {
    uiStore.notifyError('Error', `Failed to create cluster: ${error}`)
  } finally {
    creating.value = false
  }
}

async function deleteCluster(cluster: ElastiCacheCluster) {
  try {
    clusters.value = clusters.value.filter(c => c.CacheClusterId !== cluster.CacheClusterId)
    if (selectedCluster.value?.CacheClusterId === cluster.CacheClusterId) {
      selectedCluster.value = null
      clusterNodes.value = []
    }
    uiStore.notifySuccess('Success', `Cluster ${cluster.CacheClusterId} is being deleted`)
  } catch (error) {
    uiStore.notifyError('Error', `Failed to delete cluster: ${error}`)
  }
}

function resetForm() {
  newClusterId.value = ''
  newNodeType.value = 'cache.t3.micro'
  newEngine.value = 'redis'
  newEngineVersion.value = '7.0'
  newPort.value = 6379
  newNumNodes.value = 1
}

// Lifecycle
onMounted(() => {
  loadClusters()
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
        <CircleStackIcon class="h-6 w-6" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'" />
        <h1 class="text-xl font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          ElastiCache
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" :loading="loading" @click="loadClusters">
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button size="sm" @click="showCreateModal = true">
          <PlusIcon class="h-4 w-4 mr-1" />
          Create Cluster
        </Button>
      </div>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Empty State with Docker message -->
      <EmptyState
        v-if="!loading && clusters.length === 0"
        icon="server"
        title="No Cache Clusters"
        description="Launch MiniStack with Docker socket to manage ElastiCache clusters locally."
        action-label="Create Cluster"
        @action="showCreateModal = true"
      >
        <template #action>
          <div class="space-y-4">
            <p class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
              Launch MiniStack with Docker socket to manage ElastiCache clusters locally.
            </p>
            <Button @click="showCreateModal = true">
              <PlusIcon class="h-4 w-4 mr-1" />
              Create Cluster
            </Button>
          </div>
        </template>
      </EmptyState>
      
      <template v-else>
        <!-- Cluster List -->
        <div class="mb-6">
          <h2 class="text-lg font-medium mb-4" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
            Cache Clusters
          </h2>
          
          <DataTable
            :columns="clusterColumns"
            :data="clusters"
            :loading="loading"
            empty-title="No Clusters"
            empty-text="No cache clusters found"
            @row-click="selectCluster"
          >
            <template #cell-CacheClusterId="{ value, row }">
              <div class="flex items-center gap-2">
                <ServerIcon class="h-4 w-4 text-primary-500" />
                <span class="font-medium">{{ value }}</span>
              </div>
            </template>
            
            <template #cell-CacheClusterStatus="{ value }">
              <StatusBadge :status="getClusterStatus(value)" :label="value" />
            </template>
            
            <template #cell-NumCacheNodes="{ value }">
              <span>{{ value }} node{{ value > 1 ? 's' : '' }}</span>
            </template>
            
            <template #row-actions="{ row }">
              <div class="flex items-center gap-2">
                <Button 
                  v-if="selectedCluster?.CacheClusterId !== row.CacheClusterId" 
                  variant="secondary" 
                  size="sm"
                  @click.stop="selectCluster(row)"
                >
                  View Details
                </Button>
                <button
                  type="button"
                  class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  title="Delete"
                  @click.stop="deleteCluster(row)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </template>
          </DataTable>
        </div>
        
        <!-- Cluster Details -->
        <div v-if="selectedCluster" class="space-y-6">
          <div class="p-6 rounded-lg border" :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'">
            <h3 class="text-lg font-semibold mb-4" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
              Cluster Details: {{ selectedCluster.CacheClusterId }}
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                  Status
                </p>
                <StatusBadge :status="getClusterStatus(selectedCluster.CacheClusterStatus)" class="mt-1" />
              </div>
              <div>
                <p class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                  Node Type
                </p>
                <p class="mt-1 font-medium" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
                  {{ selectedCluster.CacheNodeType }}
                </p>
              </div>
              <div>
                <p class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                  Engine
                </p>
                <p class="mt-1 font-medium" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
                  {{ selectedCluster.Engine }} {{ selectedCluster.EngineVersion }}
                </p>
              </div>
              <div>
                <p class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                  Endpoint
                </p>
                <code class="mt-1 text-xs block" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
                  {{ selectedCluster.CacheClusterId }}.{{ settingsStore.darkMode ? 'fake' : 'cache' }}.us-east-1.amazonaws.com:{{ newPort }}
                </code>
              </div>
            </div>
          </div>
          
          <!-- Cache Nodes -->
          <div class="p-6 rounded-lg border" :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'">
            <h3 class="text-lg font-semibold mb-4" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
              Cache Nodes
            </h3>
            
            <DataTable
              :columns="nodeColumns"
              :data="clusterNodes"
              empty-title="No Nodes"
              empty-text="No cache nodes found"
            >
              <template #cell-CacheNodeStatus="{ value }">
                <StatusBadge :status="value === 'available' ? 'active' : 'pending'" :label="value" />
              </template>
            </DataTable>
          </div>
        </div>
      </template>
    </div>
    
    <!-- Create Cluster Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create Cache Cluster"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newClusterId"
          label="Cluster ID"
          placeholder="my-cluster"
          required
        />
        
        <FormSelect
          v-model="newNodeType"
          label="Node Type"
          :options="[
            { value: 'cache.t3.micro', label: 't3.micro (0.5 vCPU, 0.5 GB)' },
            { value: 'cache.t3.small', label: 't3.small (1 vCPU, 2 GB)' },
            { value: 'cache.t3.medium', label: 't3.medium (2 vCPU, 4 GB)' },
            { value: 'cache.m5.large', label: 'm5.large (2 vCPU, 8 GB)' },
          ]"
        />
        
        <FormSelect
          v-model="newEngine"
          label="Engine"
          :options="[
            { value: 'redis', label: 'Redis' },
            { value: 'memcached', label: 'Memcached' },
          ]"
        />
        
        <FormSelect
          v-model="newEngineVersion"
          label="Engine Version"
          :options="[
            { value: '7.0', label: '7.0' },
            { value: '6.2', label: '6.2' },
            { value: '6.0', label: '6.0' },
          ]"
        />
        
        <FormInput
          v-model="newPort"
          label="Port"
          type="number"
          placeholder="6379"
        />
        
        <FormInput
          v-model="newNumNodes"
          label="Number of Nodes"
          type="number"
          placeholder="1"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="secondary" @click="showCreateModal = false">Cancel</Button>
          <Button :loading="creating" @click="createCluster">Create</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
