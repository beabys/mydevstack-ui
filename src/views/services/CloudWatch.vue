<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import Tabs from '@/components/common/Tabs.vue'
import * as cloudwatch from '@/api/services/cloudwatch'

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const activeTab = ref<'logs' | 'metrics'>('logs')
const loading = ref(false)

// Log groups state
const logGroups = ref<any[]>([])
const logStreams = ref<any[]>([])
const logEvents = ref<any[]>([])
const selectedLogGroup = ref<string | null>(null)
const selectedLogStream = ref<string | null>(null)
const loadingLogGroups = ref(false)
const loadingLogStreams = ref(false)
const loadingLogEvents = ref(false)
const filterPattern = ref('')
const tailMode = ref(false)
let tailInterval: ReturnType<typeof setInterval> | null = null

// Metrics state
const metrics = ref<any[]>([])
const metricData = ref<any[]>([])
const loadingMetrics = ref(false)
const loadingMetricData = ref(false)
const selectedNamespace = ref('')
const selectedMetric = ref<any>(null)
const namespaces = computed(() => [...new Set(metrics.value.map((m: any) => m.Namespace))])

// Modal state
const showCreateLogGroupModal = ref(false)
const showLogEventsModal = ref(false)
const showMetricDataModal = ref(false)

// Form state
const newLogGroupName = ref('')
const creating = ref(false)

// Log group columns
const logGroupColumns = computed(() => [
  { key: 'logGroupName', label: 'Name', sortable: true },
  { key: 'retentionInDays', label: 'Retention', sortable: true },
  { key: 'storedBytes', label: 'Size', sortable: true },
  { key: 'creationTime', label: 'Created', sortable: true },
])

// Log stream columns
const logStreamColumns = computed(() => [
  { key: 'logStreamName', label: 'Name', sortable: true },
  { key: 'firstEventTimestamp', label: 'First Event', sortable: true },
  { key: 'lastEventTimestamp', label: 'Last Event', sortable: true },
  { key: 'storedBytes', label: 'Size', sortable: true },
])

// Metric columns
const metricColumns = computed(() => [
  { key: 'Namespace', label: 'Namespace', sortable: true },
  { key: 'MetricName', label: 'Metric Name', sortable: true },
  { key: 'Dimensions', label: 'Dimensions', sortable: false },
])

// Load log groups
async function loadLogGroups() {
  loadingLogGroups.value = true
  try {
    const response = await cloudwatch.describeLogGroups()
    logGroups.value = response.logGroups || []
  } catch (error) {
    console.error('Error loading log groups:', error)
    toast.error('Failed to load log groups')
  } finally {
    loadingLogGroups.value = false
  }
}

// Load log streams
async function loadLogStreams(logGroupName: string) {
  selectedLogGroup.value = logGroupName
  loadingLogStreams.value = true
  try {
    const response = await cloudwatch.describeLogStreams({ logGroupName })
    logStreams.value = response.logStreams || []
  } catch (error) {
    console.error('Error loading log streams:', error)
    toast.error('Failed to load log streams')
  } finally {
    loadingLogStreams.value = false
  }
}

// Load log events
async function loadLogEvents() {
  if (!selectedLogGroup.value || !selectedLogStream.value) return
  
  loadingLogEvents.value = true
  try {
    const response = await cloudwatch.getLogEvents({
      logGroupName: selectedLogGroup.value,
      logStreamName: selectedLogStream.value,
      filterPattern: filterPattern.value || undefined,
      limit: 100,
      startFromHead: true,
    })
    logEvents.value = response.events || []
  } catch (error) {
    console.error('Error loading log events:', error)
    toast.error('Failed to load log events')
  } finally {
    loadingLogEvents.value = false
  }
}

// Start tailing logs
function startTailMode() {
  tailMode.value = true
  tailInterval = setInterval(() => {
    loadLogEvents()
  }, 2000)
}

// Stop tailing logs
function stopTailMode() {
  tailMode.value = false
  if (tailInterval) {
    clearInterval(tailInterval)
    tailInterval = null
  }
}

// Create log group
async function createLogGroup() {
  if (!newLogGroupName.value) {
    toast.error('Log group name is required')
    return
  }

  creating.value = true
  try {
    await cloudwatch.createLogGroup({ logGroupName: newLogGroupName.value })
    toast.success('Log group created successfully')
    showCreateLogGroupModal.value = false
    newLogGroupName.value = ''
    loadLogGroups()
  } catch (error) {
    console.error('Error creating log group:', error)
    toast.error('Failed to create log group')
  } finally {
    creating.value = false
  }
}

// Delete log group
async function deleteLogGroup(logGroup: any) {
  if (!confirm(`Delete log group "${logGroup.logGroupName}"?`)) return

  try {
    await cloudwatch.deleteLogGroup(logGroup.logGroupName)
    toast.success('Log group deleted successfully')
    loadLogGroups()
  } catch (error) {
    console.error('Error deleting log group:', error)
    toast.error('Failed to delete log group')
  }
}

// Open log events modal
function openLogEventsModal(stream: any) {
  selectedLogStream.value = stream.logStreamName
  showLogEventsModal.value = true
  loadLogEvents()
}

// Format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format timestamp
function formatTimestamp(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

// Load metrics
async function loadMetrics() {
  loadingMetrics.value = true
  try {
    const response = await cloudwatch.listMetrics()
    metrics.value = response.Metrics || []
  } catch (error) {
    console.error('Error loading metrics:', error)
    toast.error('Failed to load metrics')
  } finally {
    loadingMetrics.value = false
  }
}

// Load metric data
async function loadMetricData(metric: any) {
  selectedMetric.value = metric
  loadingMetricData.value = true
  showMetricDataModal.value = true

  try {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago

    const response = await cloudwatch.getMetricData({
      MetricDataQueries: [{
        Id: 'm1',
        MetricStat: {
          Metric: {
            Namespace: metric.Namespace,
            MetricName: metric.MetricName,
            Dimensions: metric.Dimensions,
          },
          Period: 300,
          Stat: 'Average',
        },
      }],
      StartTime: startTime.toISOString(),
      EndTime: endTime.toISOString(),
    })
    metricData.value = response.MetricDataResults || []
  } catch (error) {
    console.error('Error loading metric data:', error)
    toast.error('Failed to load metric data')
  } finally {
    loadingMetricData.value = false
  }
}

// Format dimensions
function formatDimensions(dimensions: any[]): string {
  if (!dimensions || dimensions.length === 0) return '-'
  return dimensions.map((d: any) => `${d.Name}=${d.Value}`).join(', ')
}

onMounted(() => {
  loadLogGroups()
  loadMetrics()
})

onUnmounted(() => {
  stopTailMode()
})
</script>

<template>
  <div class="space-y-6">
    <h2
      class="text-xl font-semibold"
      :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
    >
      CloudWatch
    </h2>

    <!-- Tabs -->
    <Tabs
      v-model="activeTab"
      :tabs="[
        { id: 'logs', label: 'Logs' },
        { id: 'metrics', label: 'Metrics' },
      ]"
    />

    <!-- Logs Section -->
    <div
      v-if="activeTab === 'logs'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Log Groups
        </h3>
        <Button @click="showCreateLogGroupModal = true">
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
          Create Log Group
        </Button>
      </div>

      <EmptyState
        v-if="!loadingLogGroups && logGroups.length === 0"
        icon="document-text"
        title="No Log Groups"
        description="Create your first log group to start streaming logs."
        @action="showCreateLogGroupModal = true"
      />

      <DataTable
        v-else
        :columns="logGroupColumns"
        :data="logGroups"
        :loading="loadingLogGroups"
        empty-title="No Log Groups"
        empty-text="No log groups found."
      >
        <template #cell-logGroupName="{ value }">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span class="font-medium">{{ value }}</span>
          </div>
        </template>

        <template #cell-retentionInDays="{ value }">
          <span v-if="value">{{ value }} days</span>
          <span
            v-else
            class="text-light-muted dark:text-dark-muted"
          >Infinite</span>
        </template>

        <template #cell-storedBytes="{ value }">
          {{ formatBytes(value) }}
        </template>

        <template #cell-creationTime="{ value }">
          {{ new Date(value).toLocaleDateString() }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 text-sm rounded border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg"
              @click="loadLogStreams(row.logGroupName)"
            >
              View Streams
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete"
              @click="deleteLogGroup(row)"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>

      <!-- Log Streams -->
      <div
        v-if="selectedLogGroup && logStreams.length > 0"
        class="mt-6"
      >
        <h4
          class="text-md font-medium mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Log Streams: {{ selectedLogGroup }}
        </h4>
        
        <DataTable
          :columns="logStreamColumns"
          :data="logStreams"
          :loading="loadingLogStreams"
          empty-title="No Log Streams"
          empty-text="No log streams found."
        >
          <template #cell-logStreamName="{ value }">
            <div class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <span class="font-medium">{{ value }}</span>
            </div>
          </template>

          <template #cell-firstEventTimestamp="{ value }">
            {{ formatTimestamp(value) }}
          </template>

          <template #cell-lastEventTimestamp="{ value }">
            {{ formatTimestamp(value) }}
          </template>

          <template #cell-storedBytes="{ value }">
            {{ formatBytes(value) }}
          </template>

          <template #row-actions="{ row }">
            <button
              class="px-3 py-1 text-sm rounded border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg"
              @click="openLogEventsModal(row)"
            >
              View Events
            </button>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Metrics Section -->
    <div
      v-if="activeTab === 'metrics'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Metrics
        </h3>
        <Button
          variant="secondary"
          @click="loadMetrics"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </template>
          Refresh
        </Button>
      </div>

      <EmptyState
        v-if="!loadingMetrics && metrics.length === 0"
        icon="chart-bar"
        title="No Metrics"
        description="No CloudWatch metrics found in your account."
      />

      <DataTable
        v-else
        :columns="metricColumns"
        :data="metrics"
        :loading="loadingMetrics"
        empty-title="No Metrics"
        empty-text="No metrics found."
      >
        <template #cell-Namespace="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>

        <template #cell-MetricName="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>

        <template #cell-Dimensions="{ value }">
          <span class="text-sm text-light-muted dark:text-dark-muted">{{ formatDimensions(value) }}</span>
        </template>

        <template #row-actions="{ row }">
          <button
            class="px-3 py-1 text-sm rounded border border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg"
            @click="loadMetricData(row)"
          >
            View Data
          </button>
        </template>
      </DataTable>
    </div>

    <!-- Create Log Group Modal -->
    <Modal
      v-model:open="showCreateLogGroupModal"
      title="Create Log Group"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newLogGroupName"
          label="Log Group Name"
          placeholder="/aws/lambda/my-function"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateLogGroupModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createLogGroup"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Log Events Modal -->
    <Modal
      v-model:open="showLogEventsModal"
      :title="`Log Events: ${selectedLogStream}`"
      size="xl"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <FormInput
              v-model="filterPattern"
              label="Filter Pattern"
              placeholder="e.g., ERROR | [timestamp, requestId]"
            />
          </div>
          <div class="flex items-center gap-2 mt-6">
            <Button
              variant="secondary"
              size="sm"
              @click="loadLogEvents"
            >
              Search
            </Button>
            <Button 
              v-if="!tailMode" 
              variant="secondary" 
              size="sm"
              @click="startTailMode"
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </template>
              Tail
            </Button>
            <Button 
              v-else 
              variant="danger" 
              size="sm"
              @click="stopTailMode"
            >
              Stop
            </Button>
          </div>
        </div>

        <div
          v-if="loadingLogEvents"
          class="flex justify-center py-8"
        >
          <LoadingSpinner />
        </div>

        <EmptyState
          v-else-if="logEvents.length === 0"
          icon="document-text"
          title="No Log Events"
          description="No log events found for this stream."
        />

        <div
          v-else
          class="max-h-96 overflow-y-auto rounded-lg border border-light-border dark:border-dark-border"
        >
          <div
            v-for="(event, index) in logEvents"
            :key="index"
            class="px-4 py-2 border-b border-light-border dark:border-dark-border last:border-b-0 font-mono text-sm"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
          >
            <span class="text-light-muted dark:text-dark-muted mr-2">
              [{{ formatTimestamp(event.timestamp) }}]
            </span>
            {{ event.message }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="stopTailMode(); showLogEventsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Metric Data Modal -->
    <Modal
      v-model:open="showMetricDataModal"
      :title="`Metric: ${selectedMetric?.MetricName}`"
      size="lg"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          Namespace: {{ selectedMetric?.Namespace }}
        </p>

        <div
          v-if="loadingMetricData"
          class="flex justify-center py-8"
        >
          <LoadingSpinner />
        </div>

        <EmptyState
          v-else-if="metricData.length === 0"
          icon="chart-bar"
          title="No Data"
          description="No metric data available for the selected time range."
        />

        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="result in metricData"
            :key="result.Id"
            class="p-4 rounded-lg border border-light-border dark:border-dark-border"
          >
            <h4 class="font-medium mb-2">
              {{ result.Label }}
            </h4>
            <div
              v-if="result.Timestamps && result.Timestamps.length > 0"
              class="space-y-2"
            >
              <div
                v-for="(timestamp, idx) in result.Timestamps.slice(0, 10)"
                :key="idx"
                class="flex justify-between text-sm"
              >
                <span :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                  {{ new Date(timestamp).toLocaleString() }}
                </span>
                <span class="font-mono">{{ result.Values?.[idx]?.toFixed(2) || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showMetricDataModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
