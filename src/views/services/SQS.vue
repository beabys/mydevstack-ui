<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'

const settingsStore = useSettingsStore()

const queues = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Example code tabs
const selectedExample = ref(0)

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List queues
aws sqs list-queues --endpoint-url ${settingsStore.endpoint}

# Create standard queue
aws sqs create-queue --queue-name my-queue --endpoint-url ${settingsStore.endpoint}

# Create FIFO queue
aws sqs create-queue --queue-name my-queue.fifo --attributes FIFOQueue=true --endpoint-url ${settingsStore.endpoint}

# Get queue URL
aws sqs get-queue-url --queue-name my-queue --endpoint-url ${settingsStore.endpoint}

# Send message
aws sqs send-message --queue-url ${settingsStore.endpoint}/000000000000/my-queue --message-body "Hello World"

# Receive messages
aws sqs receive-message --queue-url ${settingsStore.endpoint}/000000000000/my-queue --endpoint-url ${settingsStore.endpoint}

# Delete message
aws sqs delete-message --queue-url ${settingsStore.endpoint}/000000000000/my-queue --receipt-handle "<receipt-handle>" --endpoint-url ${settingsStore.endpoint}

# Delete queue
aws sqs delete-queue --queue-url ${settingsStore.endpoint}/000000000000/my-queue --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SQSClient, ListQueuesCommand, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const client = new SQSClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List queues
const listResponse = await client.send(new ListQueuesCommand({}));
console.log(listResponse.QueueUrls);

// Create queue
const createResponse = await client.send(new CreateQueueCommand({
  QueueName: 'my-queue',
}));
console.log(createResponse.QueueUrl);

// Send message
await client.send(new SendMessageCommand({
  QueueUrl: '${settingsStore.endpoint}/000000000000/my-queue',
  MessageBody: 'Hello World',
}));

// Receive messages
const receiveResponse = await client.send(new ReceiveMessageCommand({
  QueueUrl: '${settingsStore.endpoint}/000000000000/my-queue',
  MaxNumberOfMessages: 10,
}));
console.log(receiveResponse.Messages);

// Delete message
if (receiveResponse.Messages?.[0]) {
  await client.send(new DeleteMessageCommand({
    QueueUrl: '${settingsStore.endpoint}/000000000000/my-queue',
    ReceiptHandle: receiveResponse.Messages[0].ReceiptHandle,
  }));
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'sqs',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List queues
response = client.list_queues()
print(response.get('QueueUrls', []))

# Create queue
response = client.create_queue(QueueName='my-queue')
queue_url = response['QueueUrl']

# Send message
client.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps({'key': 'value', 'message': 'Hello World'})
)

# Receive messages
response = client.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=10)
for message in response.get('Messages', []):
    print(message['Body'])
    # Delete message
    client.delete_message(QueueUrl=queue_url, ReceiptHandle=message['ReceiptHandle'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/sqs"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := sqs.NewFromConfig(cfg, func(o *sqs.Options) {
    o.BaseURL = "${settingsStore.endpoint}"
})

// List queues
listOutput, _ := client.ListQueues(context.Background(), &sqs.ListQueuesInput{})
fmt.Println(listOutput.QueueUrls)

// Create queue
createOutput, _ := client.CreateQueue(context.Background(), &sqs.CreateQueueInput{
    QueueName: aws.String("my-queue"),
})
fmt.Println(createOutput.QueueUrl)

// Send message
_, _ = client.SendMessage(context.Background(), &sqs.SendMessageInput{
    QueueUrl:    aws.String("${settingsStore.endpoint}/000000000000/my-queue"),
    MessageBody: aws.String("Hello World"),
})

// Receive messages
receiveOutput, _ := client.ReceiveMessage(context.Background(), &sqs.ReceiveMessageInput{
    QueueUrl: aws.String("${settingsStore.endpoint}/000000000000/my-queue"),
})
fmt.Println(receiveOutput.Messages)

// Delete message
if len(receiveOutput.Messages) > 0 {
    _, _ = client.DeleteMessage(context.Background(), &sqs.DeleteMessageInput{
        QueueUrl:    aws.String("${settingsStore.endpoint}/000000000000/my-queue"),
        ReceiptHandle: receiveOutput.Messages[0].ReceiptHandle,
    })
}`
  },
])

// View modal state
const showViewModal = ref(false)
const viewQueueUrl = ref('')
const viewQueueName = ref('')
const viewAttributes = ref<{ name: string; value: string }[]>([])
const viewLoading = ref(false)
const viewError = ref<string | null>(null)

async function loadQueues() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/sqs?Action=ListQueues')
    const xml = await response.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const queueUrls = doc.querySelectorAll('QueueUrl')
    const queueList: any[] = []
    
    queueUrls.forEach((urlEl) => {
      const url = urlEl.textContent || ''
      const name = url.split('/').pop() || url
      queueList.push({ url, name })
    })
    
    queues.value = queueList
  } catch (e: any) {
    error.value = e.message
    queues.value = []
  } finally {
    loading.value = false
  }
}

async function createQueue() {
  const name = prompt('Enter queue name:')
  if (!name?.trim()) return
  
  loading.value = true
  try {
    await fetch(`/sqs?Action=CreateQueue&QueueName=${encodeURIComponent(name.trim())}`)
    await loadQueues()
  } catch (e: any) {
    error.value = 'Failed to create queue: ' + e.message
  } finally {
    loading.value = false
  }
}

async function deleteQueue(url: string) {
  if (!confirm('Delete this queue?')) return
  
  loading.value = true
  try {
    await fetch(`/sqs?Action=DeleteQueue&QueueUrl=${encodeURIComponent(url)}`)
    await loadQueues()
  } catch (e: any) {
    error.value = 'Failed to delete queue: ' + e.message
  } finally {
    loading.value = false
  }
}

interface QueueAttribute {
  name: string
  value: string
  label: string
}

// Human-readable labels for SQS attributes
const attributeLabels: Record<string, string> = {
  QueueArn: 'Queue ARN',
  ApproximateNumberOfMessages: 'Approximate Number of Messages',
  ApproximateNumberOfMessagesNotVisible: 'Approximate Number of Messages (Not Visible)',
  ApproximateNumberOfMessagesDelayed: 'Approximate Number of Messages (Delayed)',
  CreatedTimestamp: 'Created Timestamp',
  LastModifiedTimestamp: 'Last Modified Timestamp',
  VisibilityTimeout: 'Visibility Timeout (seconds)',
  ReceiveMessageWaitTimeSeconds: 'Receive Message Wait Time (seconds)',
  DelaySeconds: 'Delay Seconds',
  MaximumMessageSize: 'Maximum Message Size (bytes)',
  MessageRetentionPeriod: 'Message Retention Period (seconds)',
  MinimumDelaySeconds: 'Minimum Delay Seconds',
  MaximumDelaySeconds: 'Maximum Delay Seconds',
  DeduplicationScope: 'Deduplication Scope',
  FifoQueue: 'FIFO Queue',
  ContentBasedDeduplication: 'Content-Based Deduplication',
  KmsMasterKeyId: 'KMS Master Key ID',
  KmsDataKeyReusePeriodSeconds: 'KMS Data Key Reuse Period (seconds)',
}

async function viewQueue(url: string, name: string) {
  viewQueueUrl.value = url
  viewQueueName.value = name
  viewAttributes.value = []
  viewError.value = null
  showViewModal.value = true
  viewLoading.value = true

  try {
    const response = await fetch(`/sqs?Action=GetQueueAttributes&QueueUrl=${encodeURIComponent(url)}&AttributeName=All`)
    const xml = await response.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    
    // Parse attribute elements
    const attributeElements = doc.querySelectorAll('Attribute')
    const attributes: { name: string; value: string }[] = []
    
    attributeElements.forEach((attrEl) => {
      const nameEl = attrEl.querySelector('Name')
      const valueEl = attrEl.querySelector('Value')
      const attrName = nameEl?.textContent || ''
      const attrValue = valueEl?.textContent || ''
      
      attributes.push({
        name: attrName,
        value: formatAttributeValue(attrName, attrValue)
      })
    })
    
    viewAttributes.value = attributes
  } catch (e: any) {
    viewError.value = 'Failed to get queue attributes: ' + e.message
  } finally {
    viewLoading.value = false
  }
}

// Format attribute values for display
function formatAttributeValue(name: string, value: string): string {
  // Handle timestamps
  if (name.endsWith('Timestamp') && !isNaN(Number(value))) {
    return new Date(parseInt(value) * 1000).toLocaleString()
  }
  
  // Handle seconds
  if (name.includes('Seconds') && !isNaN(Number(value))) {
    const seconds = parseInt(value)
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      return `${value} seconds (${days}d ${hours}h)`
    }
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${value} seconds (${hours}h ${mins}m)`
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${value} seconds (${mins}m ${secs}s)`
    }
  }
  
  // Handle bytes
  if (name.includes('Size') && !isNaN(Number(value))) {
    const bytes = parseInt(value)
    if (bytes >= 1048576) {
      return `${value} bytes (${(bytes / 1048576).toFixed(2)} MB)`
    }
    if (bytes >= 1024) {
      return `${value} bytes (${(bytes / 1024).toFixed(2)} KB)`
    }
  }
  
  // Handle boolean strings
  if (value === 'true') return 'Yes'
  if (value === 'false') return 'No'
  
  return value
}

function closeViewModal() {
  showViewModal.value = false
  viewQueueUrl.value = ''
  viewQueueName.value = ''
  viewAttributes.value = []
  viewError.value = null
}

onMounted(() => {
  loadQueues()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
        >
          SQS Queues
        </h1>
        <p
          class="text-sm mt-1"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          {{ queues.length }} queue(s) found
        </p>
      </div>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          @click="createQueue"
        >
          + Create Queue
        </button>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="loadQueues"
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
        v-if="queues.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No queues found. Create one to get started!
        </p>
      </div>
      
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="queue in queues"
          :key="queue.url"
          class="p-4 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3
                class="font-semibold text-lg"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                📬 {{ queue.name }}
              </h3>
              <p
                class="text-sm mt-1"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ queue.url }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                class="px-3 py-1 text-blue-500 hover:text-blue-700 border border-blue-500 rounded hover:bg-blue-50"
                @click="viewQueue(queue.url, queue.name)"
              >
                View
              </button>
              <button
                class="px-3 py-1 text-red-500 hover:text-red-700 border border-red-500 rounded hover:bg-red-50"
                @click="deleteQueue(queue.url)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Queue Modal -->
    <Modal
      :open="showViewModal"
      :title="`Queue: ${viewQueueName}`"
      size="lg"
      @update:open="showViewModal = $event"
      @close="closeViewModal"
    >
      <!-- Loading state -->
      <div
        v-if="viewLoading"
        class="text-center py-8"
      >
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p
          class="mt-2"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          Loading queue attributes...
        </p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="viewError"
        class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
      >
        {{ viewError }}
      </div>

      <!-- Queue URL -->
      <div
        v-else
        class="space-y-4"
      >
        <div
          class="p-4 rounded-lg"
          :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'"
        >
          <label
            class="block text-sm font-medium mb-1"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-gray-500'"
          >
            Queue URL
          </label>
          <code
            class="text-sm font-mono break-all"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
          >
            {{ viewQueueUrl }}
          </code>
        </div>

        <!-- Attributes Table -->
        <div v-if="viewAttributes.length > 0">
          <h3
            class="text-sm font-medium mb-3"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
          >
            Queue Attributes
          </h3>
          <div
            class="rounded-lg border overflow-hidden"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
          >
            <table class="w-full text-sm">
              <thead :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-gray-50'">
                <tr>
                  <th
                    class="px-4 py-3 text-left font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
                  >
                    Attribute
                  </th>
                  <th
                    class="px-4 py-3 text-left font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-white'">
                <tr 
                  v-for="(attr, index) in viewAttributes" 
                  :key="attr.name"
                  class="border-t"
                  :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
                >
                  <td
                    class="px-4 py-3 font-medium"
                    :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-900'"
                  >
                    {{ attributeLabels[attr.name] || attr.name }}
                  </td>
                  <td
                    class="px-4 py-3"
                    :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-gray-600'"
                  >
                    {{ attr.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-else
          class="text-center py-8"
        >
          <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-gray-500'">
            No attributes found for this queue.
          </p>
        </div>
      </div>

      <template #footer>
        <button
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          @click="closeViewModal"
        >
          Close
        </button>
      </template>
    </Modal>

    <!-- Usage Examples Section -->
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
</template>
