<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import JsonViewer from '@/components/common/JsonViewer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import * as stepfunctions from '@/api/services/step-functions'
import type { StepFunctionsStateMachine, StepFunctionsExecution } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const stateMachines = ref<StepFunctionsStateMachine[]>([])
const executions = ref<StepFunctionsExecution[]>([])
const executionHistory = ref<any[]>([])
const loading = ref(false)
const loadingExecutions = ref(false)
const loadingHistory = ref(false)
const selectedMachine = ref<StepFunctionsStateMachine | null>(null)
const selectedExecution = ref<StepFunctionsExecution | null>(null)
const machineDefinition = ref<string>('')

// Modal state
const showCreateModal = ref(false)
const showDefinitionModal = ref(false)
const showExecutionModal = ref(false)
const showHistoryModal = ref(false)

// Form state
const newMachineName = ref('')
const newMachineDefinition = ref('')
const newMachineRoleArn = ref('')
const executionInput = ref('')
const creating = ref(false)
const startingExecution = ref(false)

// Default state machine definition template
const defaultDefinition = `{
  "Comment": "A Hello World example",
  "StartAt": "Hello",
  "States": {
    "Hello": {
      "Type": "Pass",
      "Result": "Hello World!",
      "End": true
    }
  }
}`

// Columns for DataTable
const machineColumns = computed(() => [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'stateMachineArn', label: 'ARN', sortable: false },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'creationDate', label: 'Created', sortable: true },
])

const executionColumns = computed(() => [
  { key: 'name', label: 'Execution Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'startDate', label: 'Start Time', sortable: true },
  { key: 'stopDate', label: 'Stop Time', sortable: true },
])

const historyColumns = computed(() => [
  { key: 'timestamp', label: 'Timestamp', sortable: true },
  { key: 'type', label: 'Event Type', sortable: true },
  { key: 'id', label: 'ID', sortable: true },
])

// Load state machines
async function loadStateMachines() {
  loading.value = true
  try {
    const response = await stepfunctions.listStateMachines()
    stateMachines.value = response.stateMachines || []
  } catch (error) {
    console.error('Error loading state machines:', error)
    toast.error('Failed to load state machines')
  } finally {
    loading.value = false
  }
}

// Load executions for selected machine
async function loadExecutions(machine: StepFunctionsStateMachine) {
  selectedMachine.value = machine
  loadingExecutions.value = true
  try {
    const response = await stepfunctions.listExecutions(machine.stateMachineArn)
    executions.value = response.executions || []
  } catch (error) {
    console.error('Error loading executions:', error)
    toast.error('Failed to load executions')
  } finally {
    loadingExecutions.value = false
  }
}

// Load execution history
async function loadHistory(execution: StepFunctionsExecution) {
  selectedExecution.value = execution
  loadingHistory.value = true
  showHistoryModal.value = true
  try {
    const response = await stepfunctions.getExecutionHistory({ executionArn: execution.executionArn })
    executionHistory.value = response.events || []
  } catch (error) {
    console.error('Error loading execution history:', error)
    toast.error('Failed to load execution history')
  } finally {
    loadingHistory.value = false
  }
}

// View state machine definition
async function viewDefinition(machine: StepFunctionsStateMachine) {
  selectedMachine.value = machine
  loadingDefinition.value = true
  showDefinitionModal.value = true
  try {
    const details = await stepfunctions.describeStateMachine(machine.stateMachineArn)
    machineDefinition.value = details.definition
  } catch (error) {
    console.error('Error loading definition:', error)
    toast.error('Failed to load definition')
    machineDefinition.value = ''
  } finally {
    loadingDefinition.value = false
  }
}

const loadingDefinition = ref(false)

// Create state machine
async function createStateMachine() {
  if (!newMachineName.value || !newMachineDefinition.value || !newMachineRoleArn.value) {
    toast.error('Name, definition, and role ARN are required')
    return
  }

  // Validate JSON
  try {
    JSON.parse(newMachineDefinition.value)
  } catch {
    toast.error('Invalid JSON in definition')
    return
  }

  creating.value = true
  try {
    await stepfunctions.createStateMachine({
      name: newMachineName.value,
      definition: newMachineDefinition.value,
      roleArn: newMachineRoleArn.value,
    })
    toast.success('State machine created successfully')
    showCreateModal.value = false
    newMachineName.value = ''
    newMachineDefinition.value = ''
    newMachineRoleArn.value = ''
    loadStateMachines()
  } catch (error) {
    console.error('Error creating state machine:', error)
    toast.error('Failed to create state machine')
  } finally {
    creating.value = false
  }
}

// Start execution
async function startExecution() {
  if (!selectedMachine.value) return

  let input = {}
  if (executionInput.value) {
    try {
      input = JSON.parse(executionInput.value)
    } catch {
      toast.error('Invalid JSON in execution input')
      return
    }
  }

  startingExecution.value = true
  try {
    await stepfunctions.startExecution({
      stateMachineArn: selectedMachine.value.stateMachineArn,
      input: executionInput.value ? JSON.stringify(input) : '{}',
    })
    toast.success('Execution started successfully')
    showExecutionModal.value = false
    executionInput.value = ''
    loadExecutions(selectedMachine.value)
  } catch (error) {
    console.error('Error starting execution:', error)
    toast.error('Failed to start execution')
  } finally {
    startingExecution.value = false
  }
}

// Stop execution
async function stopExecution(execution: StepFunctionsExecution) {
  if (!confirm(`Stop execution "${execution.name}"?`)) return

  try {
    await stepfunctions.stopExecution({ executionArn: execution.executionArn })
    toast.success('Execution stopped successfully')
    if (selectedMachine.value) {
      loadExecutions(selectedMachine.value)
    }
  } catch (error) {
    console.error('Error stopping execution:', error)
    toast.error('Failed to stop execution')
  }
}

// Delete state machine
async function deleteMachine(machine: StepFunctionsStateMachine) {
  if (!confirm(`Delete state machine "${machine.name}"?`)) return

  try {
    await stepfunctions.deleteStateMachine(machine.stateMachineArn)
    toast.success('State machine deleted successfully')
    loadStateMachines()
  } catch (error) {
    console.error('Error deleting state machine:', error)
    toast.error('Failed to delete state machine')
  }
}

// Get status type for badge
function getStatusType(status: string): 'active' | 'inactive' | 'pending' | 'error' | 'warning' | 'success' {
  switch (status) {
    case 'SUCCEEDED': return 'success'
    case 'RUNNING': return 'pending'
    case 'FAILED':
    case 'TIMED_OUT':
    case 'ABORTED': return 'error'
    default: return 'inactive'
  }
}

// Open execution modal
function openExecutionModal(machine: StepFunctionsStateMachine) {
  selectedMachine.value = machine
  executionInput.value = ''
  showExecutionModal.value = true
}

onMounted(() => {
  loadStateMachines()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2
        class="text-xl font-semibold"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Step Functions
      </h2>
      <Button @click="showCreateModal = true">
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
        Create State Machine
      </Button>
    </div>

    <!-- State Machines List -->
    <div class="mb-6">
      <EmptyState
        v-if="!loading && stateMachines.length === 0"
        icon="play"
        title="No State Machines"
        description="Create your first state machine to get started."
        @action="showCreateModal = true"
      />

      <DataTable
        v-else
        :columns="machineColumns"
        :data="stateMachines"
        :loading="loading"
        empty-title="No State Machines"
        empty-text="No state machines found."
      >
        <template #cell-name="{ value }">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-purple-500"
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
            <span class="font-medium">{{ value }}</span>
          </div>
        </template>

        <template #cell-stateMachineArn="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>

        <template #cell-type="{ value }">
          <span class="text-sm">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <StatusBadge :status="value === 'ACTIVE' ? 'active' : 'inactive'" />
        </template>

        <template #cell-creationDate="{ value }">
          {{ new Date(value).toLocaleDateString() }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadExecutions(row)"
            >
              Executions
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="viewDefinition(row)"
            >
              Definition
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="openExecutionModal(row)"
            >
              Start
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete"
              @click="deleteMachine(row)"
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
    </div>

    <!-- Executions Section -->
    <div
      v-if="selectedMachine && executions.length > 0"
      class="mt-6"
    >
      <h4
        class="text-md font-medium mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Executions: {{ selectedMachine.name }}
      </h4>
      
      <DataTable
        :columns="executionColumns"
        :data="executions"
        :loading="loadingExecutions"
        empty-title="No Executions"
        empty-text="No executions found."
      >
        <template #cell-name="{ value }">
          <span class="font-mono text-sm">{{ value }}</span>
        </template>

        <template #cell-status="{ value }">
          <StatusBadge :status="getStatusType(value)" />
        </template>

        <template #cell-startDate="{ value }">
          {{ new Date(value).toLocaleString() }}
        </template>

        <template #cell-stopDate="{ value }">
          {{ value ? new Date(value).toLocaleString() : '-' }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadHistory(row)"
            >
              History
            </button>
            <button
              v-if="row.status === 'RUNNING'"
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              @click="stopExecution(row)"
            >
              Stop
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create State Machine Modal -->
    <Modal
      v-model:open="showCreateModal"
      title="Create State Machine"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newMachineName"
          label="State Machine Name"
          placeholder="my-state-machine"
          required
        />
        <FormInput
          v-model="newMachineRoleArn"
          label="Role ARN"
          placeholder="arn:aws:iam::123456789012:role/stepfunctions-role"
          required
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Definition (JSON) <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="newMachineDefinition"
            class="w-full h-64 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            :placeholder="defaultDefinition"
            required
          />
          <p
            class="mt-1 text-xs"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Use the default template or provide your own JSON state machine definition.
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
            @click="createStateMachine"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- View Definition Modal -->
    <Modal
      v-model:open="showDefinitionModal"
      title="State Machine Definition"
      size="lg"
    >
      <div
        v-if="loadingDefinition"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      <JsonViewer
        v-else-if="machineDefinition"
        :data="JSON.parse(machineDefinition)"
      />
      <p
        v-else
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        No definition available.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDefinitionModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Start Execution Modal -->
    <Modal
      v-model:open="showExecutionModal"
      title="Start Execution"
      size="md"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          State Machine: {{ selectedMachine?.name }}
        </p>
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Execution Input (JSON)
          </label>
          <textarea
            v-model="executionInput"
            class="w-full h-40 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;key&quot;: &quot;value&quot;}"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showExecutionModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="startingExecution"
            @click="startExecution"
          >
            Start
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Execution History Modal -->
    <Modal
      v-model:open="showHistoryModal"
      title="Execution History"
      size="xl"
    >
      <div
        v-if="loadingHistory"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      
      <EmptyState
        v-else-if="executionHistory.length === 0"
        icon="clock"
        title="No History"
        description="No execution history available."
      />

      <DataTable
        v-else
        :columns="historyColumns"
        :data="executionHistory"
        empty-title="No History"
        empty-text="No events found."
      >
        <template #cell-timestamp="{ value }">
          {{ new Date(value).toLocaleString() }}
        </template>
        <template #cell-type="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>
        <template #cell-id="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
      </DataTable>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showHistoryModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
