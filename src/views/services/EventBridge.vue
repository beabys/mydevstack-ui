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
import * as eventBridge from '@/api/services/eventbridge'
import type { EventBridgeEventBus, EventBridgeRule, EventBridgeTarget } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const toast = useToast()

// State
const activeTab = ref<'buses' | 'rules'>('buses')
const eventBuses = ref<EventBridgeEventBus[]>([])
const rules = ref<EventBridgeRule[]>([])
const targets = ref<EventBridgeTarget[]>([])
const loading = ref(false)
const loadingRules = ref(false)
const loadingTargets = ref(false)
const selectedBus = ref<EventBridgeEventBus | null>(null)
const selectedRule = ref<EventBridgeRule | null>(null)
const showExamples = ref(false)

// Modal state
const showCreateBusModal = ref(false)
const showCreateRuleModal = ref(false)
const showTargetsModal = ref(false)
const showTestEventModal = ref(false)
const showBusDetailsModal = ref(false)
const showAddTargetsModal = ref(false)
const showEditRuleModal = ref(false)
const showDeleteRuleModal = ref(false)
const showDeleteBusModal = ref(false)

// Delete state
const ruleToDelete = ref<EventBridgeRule | null>(null)
const busToDelete = ref<EventBridgeEventBus | null>(null)

// Form state
const newBusName = ref('')
const newBusDescription = ref('')
const newRuleName = ref('')
const newRuleDescription = ref('')
const newRuleEventPattern = ref('')
const newRuleState = ref<'ENABLED' | 'DISABLED'>('ENABLED')
const newRuleSchedule = ref('')
const testEventJson = ref('')
const testEventResult = ref<boolean | null>(null)

const newTargetForm = ref({
  targetType: 'lambda',
  targetArn: '',
  inputTransformer: '',
})

const creating = ref(false)

// Event bus columns
const busColumns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'Arn', label: 'ARN', sortable: false },
  { key: 'Description', label: 'Description', sortable: false },
])

// Rule columns
const ruleColumns = computed(() => [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'State', label: 'State', sortable: true },
  { key: 'EventPattern', label: 'Event Pattern', sortable: false },
  { key: 'ScheduleExpression', label: 'Schedule', sortable: false },
])

// Target columns
const targetColumns = computed(() => [
  { key: 'Id', label: 'ID', sortable: true },
  { key: 'Arn', label: 'ARN', sortable: false },
  { key: 'Input', label: 'Input', sortable: false },
])

// Target type options
const targetTypeOptions = [
  { value: 'lambda', label: 'Lambda Function' },
  { value: 'sqs', label: 'SQS Queue' },
  { value: 'sns', label: 'SNS Topic' },
  { value: 'kinesis', label: 'Kinesis Stream' },
  { value: 'firehose', label: 'Firehose' },
  { value: 'ecs', label: 'ECS Task' },
  { value: 'stepfunctions', label: 'Step Functions' },
]

// Code examples
const selectedExample = ref(0)
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List EventBridge event buses
aws events list-event-buses --endpoint-url ${settingsStore.endpoint}

# Create event bus
aws events create-event-bus \\
  --name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}

# Describe event bus
aws events describe-event-bus \\
  --name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}

# List rules for event bus
aws events list-rules \\
  --event-bus-name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}

# Create rule
aws events put-rule \\
  --name my-rule \\
  --event-bus-name my-event-bus \\
  --event-pattern '{"source": ["my.source"]}' \\
  --state ENABLED \\
  --endpoint-url ${settingsStore.endpoint}

# Add target to rule
aws events put-targets \\
  --rule my-rule \\
  --event-bus-name my-event-bus \\
  --targets Id=my-target,Arn=arn:aws:lambda:us-east-1:123456789012:function:my-function \\
  --endpoint-url ${settingsStore.endpoint}

# List targets for rule
aws events list-targets-by-rule \\
  --rule my-rule \\
  --event-bus-name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}

# Delete rule
aws events delete-rule \\
  --name my-rule \\
  --event-bus-name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}

# Delete event bus
aws events delete-event-bus \\
  --name my-event-bus \\
  --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { EventBridgeClient, ListEventBusesCommand, CreateEventBusCommand, DescribeEventBusCommand, ListRulesCommand, PutRuleCommand, PutTargetsCommand, ListTargetsByRuleCommand } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List event buses
const buses = await client.send(new ListEventBusesCommand({}));
console.log(buses.EventBuses);

// Create event bus
await client.send(new CreateEventBusCommand({
  Name: 'my-event-bus',
}));

// Describe event bus
const bus = await client.send(new DescribeEventBusCommand({
  Name: 'my-event-bus',
}));
console.log(bus);

// List rules
const rules = await client.send(new ListRulesCommand({
  EventBusName: 'my-event-bus',
}));
console.log(rules.Rules);

// Create rule with event pattern
await client.send(new PutRuleCommand({
  Name: 'my-rule',
  EventBusName: 'my-event-bus',
  EventPattern: JSON.stringify({ source: ['my.source'] }),
  State: 'ENABLED',
}));

// Add target
await client.send(new PutTargetsCommand({
  Rule: 'my-rule',
  EventBusName: 'my-event-bus',
  Targets: [{
    Id: 'my-target',
    Arn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function',
  }],
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'events',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List event buses
response = client.list_event_buses()
for bus in response['EventBuses']:
    print(bus['Name'])

# Create event bus
client.create_event_bus(Name='my-event-bus')

# Describe event bus
response = client.describe_event_bus(Name='my-event-bus')
print(response)

# List rules
response = client.list_rules(EventBusName='my-event-bus')
for rule in response['Rules']:
    print(rule['Name'])

# Create rule
client.put_rule(
    Name='my-rule',
    EventBusName='my-event-bus',
    EventPattern=json.dumps({'source': ['my.source']}),
    State='ENABLED',
)

# Add target
client.put_targets(
    Rule='my-rule',
    EventBusName='my-event-bus',
    Targets=[{
        'Id': 'my-target',
        'Arn': 'arn:aws:lambda:us-east-1:123456789012:function:my-function',
    }],
)

# List targets
response = client.list_targets_by_rule(
    Rule='my-rule',
    EventBusName='my-event-bus'
)
print(response['Targets'])`
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
    "github.com/aws/aws-sdk-go-v2/service/eventbridge"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := eventbridge.NewFromConfig(cfg, func(o *eventbridge.Options) {
    o.BaseURL = aws.String("${settingsStore.endpoint}")
})

// List event buses
buses, _ := client.ListEventBuses(context.Background(), &eventbridge.ListEventBusesInput{})
fmt.Println(buses.EventBuses)

// Create event bus
_, _ = client.CreateEventBus(context.Background(), &eventbridge.CreateEventBusInput{
    Name: aws.String("my-event-bus"),
})

// Describe event bus
bus, _ := client.DescribeEventBus(context.Background(), &eventbridge.DescribeEventBusInput{
    Name: aws.String("my-event-bus"),
})
fmt.Println(bus)

// List rules
rules, _ := client.ListRules(context.Background(), &eventbridge.ListRulesInput{
    EventBusName: aws.String("my-event-bus"),
})
fmt.Println(rules.Rules)

// Create rule
_, _ = client.PutRule(context.Background(), &eventbridge.PutRuleInput{
    Name:          aws.String("my-rule"),
    EventBusName:  aws.String("my-event-bus"),
    EventPattern:  aws.String(json.dumps(map[string][]string{"source": {"my.source"}})),
    State:         eventbridge.RuleStateEnabled,
})

// Add target
_, _ = client.PutTargets(context.Background(), &eventbridge.PutTargetsInput{
    Rule:        aws.String("my-rule"),
    EventBusName: aws.String("my-event-bus"),
    Targets: []eventbridge.Target{
        {
            Id:  aws.String("my-target"),
            Arn: aws.String("arn:aws:lambda:us-east-1:123456789012:function:my-function"),
        },
    },
})`
  },
])

// Load event buses
async function loadEventBuses() {
  loading.value = true
  try {
    const response = await eventBridge.listEventBuses()
    eventBuses.value = response.EventBuses || []
  } catch (error) {
    console.error('Error loading event buses:', error)
    toast.error('Failed to load event buses')
  } finally {
    loading.value = false
  }
}

// Load rules for selected bus
async function loadRules(bus: EventBridgeEventBus) {
  selectedBus.value = bus
  loadingRules.value = true
  try {
    const response = await eventBridge.listRules({ EventBusName: bus.Name })
    rules.value = response.Rules || []
  } catch (error) {
    console.error('Error loading rules:', error)
    toast.error('Failed to load rules')
  } finally {
    loadingRules.value = false
  }
}

// Load targets for selected rule
async function loadTargets(rule: EventBridgeRule) {
  if (!selectedBus.value) return
  selectedRule.value = rule
  loadingTargets.value = true
  showTargetsModal.value = true
  try {
    const response = await eventBridge.listTargets(selectedBus.value.Name, rule.Name)
    targets.value = response.Targets || []
  } catch (error) {
    console.error('Error loading targets:', error)
    toast.error('Failed to load targets')
  } finally {
    loadingTargets.value = false
  }
}

// Create event bus
async function createBus() {
  if (!newBusName.value) {
    toast.error('Event bus name is required')
    return
  }

  creating.value = true
  try {
    await eventBridge.createEventBus({
      Name: newBusName.value,
      Description: newBusDescription.value,
    })
    toast.success('Event bus created successfully')
    showCreateBusModal.value = false
    newBusName.value = ''
    newBusDescription.value = ''
    loadEventBuses()
  } catch (error) {
    console.error('Error creating event bus:', error)
    toast.error('Failed to create event bus')
  } finally {
    creating.value = false
  }
}

// Create rule
async function createRule() {
  if (!newRuleName.value) {
    toast.error('Rule name is required')
    return
  }

  if (!selectedBus.value) {
    toast.error('Please select an event bus first')
    return
  }

  creating.value = true
  try {
    await eventBridge.putRule({
      Name: newRuleName.value,
      EventBusName: selectedBus.value.Name,
      Description: newRuleDescription.value,
      EventPattern: newRuleEventPattern.value || undefined,
      ScheduleExpression: newRuleSchedule.value || undefined,
      State: newRuleState.value,
    })
    toast.success('Rule created successfully')
    showCreateRuleModal.value = false
    newRuleName.value = ''
    newRuleDescription.value = ''
    newRuleEventPattern.value = ''
    newRuleSchedule.value = ''
    newRuleState.value = 'ENABLED'
    loadRules(selectedBus.value)
  } catch (error) {
    console.error('Error creating rule:', error)
    toast.error('Failed to create rule')
  } finally {
    creating.value = false
  }
}

// Edit rule
function openEditRuleModal(rule: EventBridgeRule) {
  selectedRule.value = rule
  newRuleName.value = rule.Name || ''
  newRuleDescription.value = rule.Description || ''
  newRuleEventPattern.value = rule.EventPattern || ''
  newRuleSchedule.value = rule.ScheduleExpression || ''
  newRuleState.value = rule.State || 'ENABLED'
  showEditRuleModal.value = true
}

async function updateRule() {
  if (!selectedBus.value || !selectedRule.value) return

  creating.value = true
  try {
    await eventBridge.putRule({
      Name: newRuleName.value,
      EventBusName: selectedBus.value.Name,
      Description: newRuleDescription.value,
      EventPattern: newRuleEventPattern.value || undefined,
      ScheduleExpression: newRuleSchedule.value || undefined,
      State: newRuleState.value,
    })
    toast.success('Rule updated successfully')
    showEditRuleModal.value = false
    loadRules(selectedBus.value)
  } catch (error) {
    console.error('Error updating rule:', error)
    toast.error('Failed to update rule')
  } finally {
    creating.value = false
  }
}

// Toggle rule state
async function toggleRuleState(rule: EventBridgeRule) {
  if (!selectedBus.value) return

  try {
    if (rule.State === 'ENABLED') {
      await eventBridge.disableRule(rule.Name, rule.EventBusName)
    } else {
      await eventBridge.enableRule(rule.Name, rule.EventBusName)
    }
    toast.success(`Rule ${rule.State === 'ENABLED' ? 'disabled' : 'enabled'} successfully`)
    loadRules(selectedBus.value)
  } catch (error) {
    console.error('Error toggling rule state:', error)
    toast.error('Failed to toggle rule state')
  }
}

// Open delete rule modal
function openDeleteRuleModal(rule: EventBridgeRule) {
  ruleToDelete.value = rule
  showDeleteRuleModal.value = true
}

// Delete rule
async function confirmDeleteRule() {
  if (!selectedBus.value || !ruleToDelete.value) return

  try {
    await eventBridge.deleteRule(ruleToDelete.value.Name, selectedBus.value.Name)
    toast.success('Rule deleted successfully')
    showDeleteRuleModal.value = false
    ruleToDelete.value = null
    loadRules(selectedBus.value)
  } catch (error) {
    console.error('Error deleting rule:', error)
    toast.error('Failed to delete rule')
  }
}

// View bus details
async function viewBusDetails(bus: EventBridgeEventBus) {
  selectedBus.value = bus
  showBusDetailsModal.value = true
}

// Add targets
function openAddTargetsModal(rule: EventBridgeRule) {
  selectedRule.value = rule
  newTargetForm.value = {
    targetType: 'lambda',
    targetArn: '',
    inputTransformer: '',
  }
  showAddTargetsModal.value = true
}

async function addTargets() {
  if (!selectedBus.value || !selectedRule.value || !newTargetForm.value.targetArn) {
    toast.error('Target ARN is required')
    return
  }

  try {
    await eventBridge.putTargets(selectedRule.value.Name, selectedBus.value.Name, [{
      Id: `${selectedRule.value.Name}-target-${Date.now()}`,
      Arn: newTargetForm.value.targetArn,
      Input: newTargetForm.value.inputTransformer || undefined,
    }])
    toast.success('Target added successfully')
    showAddTargetsModal.value = false
    loadTargets(selectedRule.value)
  } catch (error) {
    console.error('Error adding target:', error)
    toast.error('Failed to add target')
  }
}

// Remove target
async function removeTarget(targetId: string) {
  if (!selectedBus.value || !selectedRule.value) return

  try {
    await eventBridge.removeTargets(selectedRule.value.Name, selectedBus.value.Name, [targetId])
    toast.success('Target removed successfully')
    loadTargets(selectedRule.value)
  } catch (error) {
    console.error('Error removing target:', error)
    toast.error('Failed to remove target')
  }
}

// Send test event
async function sendTestEvent() {
  if (!testEventJson.value || !selectedRule.value) {
    toast.error('Please provide test event JSON and select a rule')
    return
  }

  try {
    const event = JSON.parse(testEventJson.value)
    const result = await eventBridge.testEventPattern(selectedRule.value.EventPattern || '', event)
    testEventResult.value = result.Result
    toast.success(`Test event ${result.Result ? 'matched' : 'did not match'} the pattern`)
  } catch (error) {
    console.error('Error testing event:', error)
    toast.error('Failed to test event - check JSON format')
    testEventResult.value = null
  }
}

// Open delete bus modal
function openDeleteBusModal(bus: EventBridgeEventBus) {
  busToDelete.value = bus
  showDeleteBusModal.value = true
}

// Delete event bus
async function confirmDeleteBus() {
  if (!busToDelete.value) return

  try {
    await eventBridge.deleteEventBus(busToDelete.value.Name)
    toast.success('Event bus deleted successfully')
    showDeleteBusModal.value = false
    busToDelete.value = null
    loadEventBuses()
  } catch (error) {
    console.error('Error deleting event bus:', error)
    toast.error('Failed to delete event bus')
  }
}

// Copy ARN to clipboard
function copyArn(arn: string) {
  navigator.clipboard.writeText(arn)
  toast.success('ARN copied to clipboard')
}

onMounted(() => {
  loadEventBuses()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            EventBridge
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ eventBuses.length }} bus{{ eventBuses.length !== 1 ? 'es' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            @click="showTestEventModal = true"
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
            Test Event
          </Button>
          <Button
            variant="primary"
            @click="showCreateBusModal = true"
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
            Create Event Bus
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Usage Examples -->
      <div class="mb-6">
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

      <!-- Tabs -->
      <div class="border-b border-light-border dark:border-dark-border mb-6">
        <nav class="flex space-x-8">
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'buses'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
            @click="activeTab = 'buses'"
          >
            Event Buses
          </button>
          <button
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'rules'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
            @click="activeTab = 'rules'"
          >
            Rules
          </button>
        </nav>
      </div>

      <!-- Event Buses Tab -->
      <div v-if="activeTab === 'buses'">
        <!-- Loading State -->
        <div
          v-if="loading"
          class="flex items-center justify-center py-12"
        >
          <LoadingSpinner size="lg" />
        </div>

        <!-- Empty State -->
        <EmptyState
          v-else-if="eventBuses.length === 0"
          icon="table-cells"
          title="No Event Buses"
          description="Create your first event bus to start routing events."
          action-label="Create Event Bus"
          @action="showCreateBusModal = true"
        />

        <!-- Event Buses Table -->
        <DataTable
          v-else
          :columns="busColumns"
          :data="eventBuses"
          :loading="loading"
          empty-title="No Event Buses"
          empty-text="No event buses found."
        >
          <template #cell-Name="{ value, row }">
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
              <span
                v-if="value === 'default'"
                class="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              >
                Default
              </span>
            </div>
          </template>

          <template #cell-Arn="{ value }">
            <div class="flex items-center gap-2">
              <code class="text-xs text-light-muted dark:text-dark-muted bg-light-border dark:bg-dark-border px-2 py-1 rounded truncate max-w-xs">{{ value }}</code>
              <button
                class="text-light-muted dark:text-dark-muted hover:text-primary-500"
                @click="copyArn(value)"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </template>

          <template #cell-Description="{ value }">
            <span class="text-light-muted dark:text-dark-muted">{{ value || '-' }}</span>
          </template>

          <template #row-actions="{ row }">
            <div class="flex items-center gap-1">
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                @click="viewBusDetails(row)"
              >
                Details
              </button>
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                @click="loadRules(row)"
              >
                View Rules
              </button>
              <button
                class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                :disabled="row.Name === 'default'"
                @click="openDeleteBusModal(row)"
              >
                Delete
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Rules Tab -->
      <div v-if="activeTab === 'rules'">
        <div
          v-if="!selectedBus"
          class="text-center py-12"
        >
          <EmptyState
            icon="table-cells"
            title="Select an Event Bus"
            description="Select an event bus to view its rules"
          />
        </div>

        <div v-else>
          <div class="mb-4 flex items-center justify-between">
            <h3
              class="text-lg font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Rules for: {{ selectedBus.Name }}
            </h3>
            <Button
              variant="secondary"
              size="sm"
              @click="showCreateRuleModal = true"
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
              Create Rule
            </Button>
          </div>

          <EmptyState
            v-if="!loadingRules && rules.length === 0"
            icon="table-cells"
            title="No Rules"
            description="Create your first rule to start routing events."
            action-label="Create Rule"
            @action="showCreateRuleModal = true"
          />

          <DataTable
            v-else
            :columns="ruleColumns"
            :data="rules"
            :loading="loadingRules"
            empty-title="No Rules"
            empty-text="No rules found for this event bus."
          >
            <template #cell-Name="{ value }">
              <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
            </template>

            <template #cell-State="{ value }">
              <StatusBadge
                :status="value === 'ENABLED' ? 'active' : 'inactive'"
                :label="value"
              />
            </template>

            <template #cell-EventPattern="{ value }">
              <code
                v-if="value"
                class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded"
              >
                {{ value.substring(0, 50) }}{{ value.length > 50 ? '...' : '' }}
              </code>
              <span
                v-else
                class="text-light-muted dark:text-dark-muted"
              >-</span>
            </template>

            <template #cell-ScheduleExpression="{ value }">
              <code
                v-if="value"
                class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded"
              >
                {{ value }}
              </code>
              <span
                v-else
                class="text-light-muted dark:text-dark-muted"
              >-</span>
            </template>

            <template #row-actions="{ row }">
              <div class="flex items-center gap-1">
                <button
                  class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                  @click="toggleRuleState(row)"
                >
                  {{ row.State === 'ENABLED' ? 'Disable' : 'Enable' }}
                </button>
                <button
                  class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                  @click="openEditRuleModal(row)"
                >
                  Edit
                </button>
                <button
                  class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                  @click="openAddTargetsModal(row)"
                >
                  Add Targets
                </button>
                <button
                  class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
                  @click="loadTargets(row)"
                >
                  Targets
                </button>
                <button
                  class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
                  @click="openDeleteRuleModal(row)"
                >
                  Delete
                </button>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Create Event Bus Modal -->
    <Modal
      v-model:open="showCreateBusModal"
      title="Create Event Bus"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newBusName"
          label="Event Bus Name"
          placeholder="my-event-bus"
          required
        />
        <FormInput
          v-model="newBusDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateBusModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createBus"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Bus Details Modal -->
    <Modal
      v-model:open="showBusDetailsModal"
      :title="`Event Bus: ${selectedBus?.Name || ''}`"
      size="lg"
    >
      <div
        v-if="selectedBus"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedBus.Name }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
              {{ selectedBus.Arn }}
            </p>
          </div>
        </div>
        <div v-if="selectedBus.Description">
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
          <p class="text-sm text-light-text dark:text-dark-text">
            {{ selectedBus.Description }}
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showBusDetailsModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Create Rule Modal -->
    <Modal
      v-model:open="showCreateRuleModal"
      title="Create Rule"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRuleName"
          label="Rule Name"
          placeholder="my-rule"
          required
        />
        <FormInput
          v-model="newRuleDescription"
          label="Description"
          placeholder="Optional description"
        />
        <FormSelect
          v-model="newRuleState"
          label="State"
          :options="[
            { value: 'ENABLED', label: 'Enabled' },
            { value: 'DISABLED', label: 'Disabled' },
          ]"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Event Pattern (JSON)
          </label>
          <textarea
            v-model="newRuleEventPattern"
            class="w-full h-32 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;source&quot;: [&quot;my.source&quot;], &quot;detail-type&quot;: [&quot;MyEvent&quot;]}"
          />
        </div>
        <FormInput
          v-model="newRuleSchedule"
          label="Schedule Expression (cron/rate)"
          placeholder="rate(5 minutes) or cron(0 * * * ? *)"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateRuleModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRule"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Edit Rule Modal -->
    <Modal
      v-model:open="showEditRuleModal"
      title="Edit Rule"
      size="lg"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRuleName"
          label="Rule Name"
          placeholder="my-rule"
          required
        />
        <FormInput
          v-model="newRuleDescription"
          label="Description"
          placeholder="Optional description"
        />
        <FormSelect
          v-model="newRuleState"
          label="State"
          :options="[
            { value: 'ENABLED', label: 'Enabled' },
            { value: 'DISABLED', label: 'Disabled' },
          ]"
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Event Pattern (JSON)
          </label>
          <textarea
            v-model="newRuleEventPattern"
            class="w-full h-32 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;source&quot;: [&quot;my.source&quot;], &quot;detail-type&quot;: [&quot;MyEvent&quot;]}"
          />
        </div>
        <FormInput
          v-model="newRuleSchedule"
          label="Schedule Expression (cron/rate)"
          placeholder="rate(5 minutes) or cron(0 * * * ? *)"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditRuleModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="updateRule"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Targets Modal -->
    <Modal
      v-model:open="showTargetsModal"
      :title="`Targets for: ${selectedRule?.Name || ''}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="openAddTargetsModal(selectedRule!)"
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
          Add Target
        </Button>
      </div>

      <div
        v-if="loadingTargets"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      <EmptyState
        v-else-if="targets.length === 0"
        icon="table-cells"
        title="No Targets"
        description="This rule has no targets configured."
      />
      <DataTable
        v-else
        :columns="targetColumns"
        :data="targets"
        empty-title="No Targets"
        empty-text="No targets found."
      >
        <template #cell-Id="{ value }">
          <span class="font-medium text-light-text dark:text-dark-text">{{ value }}</span>
        </template>
        <template #cell-Arn="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
        <template #cell-Input="{ value }">
          <code
            v-if="value"
            class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded"
          >
            {{ value.substring(0, 50) }}{{ value.length > 50 ? '...' : '' }}
          </code>
          <span
            v-else
            class="text-light-muted dark:text-dark-muted"
          >-</span>
        </template>
        <template #row-actions="{ row }">
          <button
            class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
            @click="removeTarget(row.Id)"
          >
            Remove
          </button>
        </template>
      </DataTable>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showTargetsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Add Targets Modal -->
    <Modal
      v-model:open="showAddTargetsModal"
      :title="`Add Target to: ${selectedRule?.Name || ''}`"
      size="md"
    >
      <div class="space-y-4">
        <FormSelect
          v-model="newTargetForm.targetType"
          label="Target Type"
          :options="targetTypeOptions"
        />
        <FormInput
          v-model="newTargetForm.targetArn"
          label="Target ARN"
          placeholder="arn:aws:lambda:us-east-1:123456789012:function:my-function"
          required
        />
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Input Transformer (Optional JSON)
          </label>
          <textarea
            v-model="newTargetForm.inputTransformer"
            class="w-full h-24 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;key&quot;: &quot;value&quot;}"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showAddTargetsModal = false"
          >
            Cancel
          </Button>
          <Button @click="addTargets">
            Add Target
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Test Event Modal -->
    <Modal
      v-model:open="showTestEventModal"
      title="Test Event Pattern"
      size="lg"
    >
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Test Event (JSON)
          </label>
          <textarea
            v-model="testEventJson"
            class="w-full h-40 px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            placeholder="{&quot;source&quot;: &quot;my.source&quot;, &quot;detail-type&quot;: &quot;MyEvent&quot;, &quot;detail&quot;: {}}"
          />
        </div>
        <div
          v-if="testEventResult !== null"
          class="p-4 rounded-lg"
          :class="testEventResult ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'"
        >
          <p :class="testEventResult ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
            {{ testEventResult ? 'Event matched the pattern!' : 'Event did not match the pattern.' }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showTestEventModal = false"
          >
            Close
          </Button>
          <Button @click="sendTestEvent">
            Test Event
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Rule Confirmation Modal -->
    <Modal
      v-model:open="showDeleteRuleModal"
      title="Delete Rule"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the rule <strong>"{{ ruleToDelete?.Name }}"</strong>?
          This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteRuleModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteRule"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Bus Confirmation Modal -->
    <Modal
      v-model:open="showDeleteBusModal"
      title="Delete Event Bus"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the event bus <strong>"{{ busToDelete?.Name }}"</strong>?
          This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteBusModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            @click="confirmDeleteBus"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
