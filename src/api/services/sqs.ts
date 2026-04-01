/**
 * SQS Service API
 * Handles all AWS Simple Queue Service operations via the API client
 */

import { api, parseXML } from '../client'
import type { SQSQueue, SQSMessage, SQSCreateQueueRequest, SQSReceiveMessageResponse } from '../types/aws'

// Response types for XML parsing
interface ListQueuesResponse {
  ListQueuesResult?: {
    QueueUrl?: string[]
    NextToken?: string
  }
}

interface GetQueueAttributesResponse {
  GetQueueAttributesResult?: {
    Attribute?: Array<{
      Name: string
      Value: string
    }>
  }
}

interface ReceiveMessageResponse {
  ReceiveMessageResult?: {
    Message?: Array<{
      MessageId: string
      ReceiptHandle: string
      MD5OfBody: string
      Body: string
      Attributes?: {
        Entry?: Array<{
          Name: string
          Value: string
        }>
      }
      MessageAttributes?: {
        Entry?: Array<{
          Name: string
          Value: {
            DataType: string
            StringValue?: string
            BinaryValue?: string
          }
        }>
      }
    }>
  }
}

interface SendMessageResponse {
  SendMessageResult?: {
    MessageId: string
    MD5OfMessageBody: string
    MD5OfMessageAttributes?: string
  }
}

interface CreateQueueResponse {
  CreateQueueResult?: {
    QueueUrl: string
  }
}

interface GetQueueUrlResponse {
  GetQueueUrlResult?: {
    QueueUrl: string
    QueueArn: string
  }
}

interface ListDeadLetterSourceQueuesResponse {
  ListDeadLetterSourceQueuesResult?: {
    QueueUrl?: string[]
  }
}

interface ListDeadLetterSourceQueuesResult {
  QueueUrl: string[]
}

/**
 * List all SQS queues
 */
export async function listQueues(prefix?: string): Promise<string[]> {
  try {
    const params = new URLSearchParams()
    if (prefix) {
      params.append('QueueNamePrefix', prefix)
    }

    const response = await api.get(`/sqs?Action=ListQueues${prefix ? `&QueueNamePrefix=${encodeURIComponent(prefix)}` : ''}`)
    
    // Handle XML response
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListQueuesResponse>(xmlData)
    
    if (parsed?.ListQueuesResult?.QueueUrl) {
      const urls = parsed.ListQueuesResult.QueueUrl
      return Array.isArray(urls) ? urls : [urls]
    }
    
    return []
  } catch (error) {
    console.error('Error listing queues:', error)
    throw error
  }
}

/**
 * Get queue URL by name
 */
export async function getQueueUrl(queueName: string): Promise<string | null> {
  try {
    const response = await api.get(`/sqs?Action=GetQueueUrl&QueueName=${encodeURIComponent(queueName)}`)
    
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetQueueUrlResponse>(xmlData)
    
    return parsed?.GetQueueUrlResult?.QueueUrl || null
  } catch (error) {
    console.error('Error getting queue URL:', error)
    throw error
  }
}

/**
 * Get queue attributes
 */
export async function getQueueAttributes(queueUrl: string, attributeNames: string[] = ['All']): Promise<Record<string, string>> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    attributeNames.forEach((name, index) => {
      params.append(`AttributeName.${index + 1}`, name)
    })

    const queryString = params.toString().replace(/&/g, '&')
    const response = await api.get(`/sqs?Action=GetQueueAttributes&${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetQueueAttributesResponse>(xmlData)
    
    const attributes: Record<string, string> = {}
    if (parsed?.GetQueueAttributesResult?.Attribute) {
      const attrs = parsed.GetQueueAttributesResult.Attribute
      const attrArray = Array.isArray(attrs) ? attrs : [attrs]
      attrArray.forEach((attr) => {
        attributes[attr.Name] = attr.Value
      })
    }
    
    return attributes
  } catch (error) {
    console.error('Error getting queue attributes:', error)
    throw error
  }
}

/**
 * Create a new SQS queue
 */
export async function createQueue(request: SQSCreateQueueRequest): Promise<string> {
  try {
    const params = new URLSearchParams()
    params.append('QueueName', request.QueueName)
    
    if (request.Attributes) {
      Object.entries(request.Attributes).forEach(([key, value], index) => {
        params.append(`Attribute.${index + 1}.Name`, key)
        params.append(`Attribute.${index + 1}.Value`, value)
      })
    }

    if (request.tags) {
      Object.entries(request.tags).forEach(([key, value], index) => {
        params.append(`Tag.${index + 1}.Key`, key)
        params.append(`Tag.${index + 1}.Value`, value)
      })
    }

    const queryString = params.toString().replace(/&/g, '&')
    const response = await api.get(`/sqs?Action=CreateQueue&${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<CreateQueueResponse>(xmlData)
    
    if (!parsed?.CreateQueueResult?.QueueUrl) {
      throw new Error('Failed to create queue: No URL returned')
    }
    
    return parsed.CreateQueueResult.QueueUrl
  } catch (error) {
    console.error('Error creating queue:', error)
    throw error
  }
}

/**
 * Delete a queue
 */
export async function deleteQueue(queueUrl: string): Promise<void> {
  try {
    await api.get(`/sqs?Action=DeleteQueue&QueueUrl=${encodeURIComponent(queueUrl)}`)
  } catch (error) {
    console.error('Error deleting queue:', error)
    throw error
  }
}

/**
 * Send a message to a queue
 */
export async function sendMessage(
  queueUrl: string,
  messageBody: string,
  options?: {
    delaySeconds?: number
    messageAttributes?: Record<string, { DataType: string; StringValue?: string }>
  }
): Promise<{ MessageId: string; MD5OfBody: string }> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    params.append('MessageBody', messageBody)
    
    if (options?.delaySeconds !== undefined) {
      params.append('DelaySeconds', String(options.delaySeconds))
    }

    if (options?.messageAttributes) {
      let attrIndex = 1
      for (const [key, value] of Object.entries(options.messageAttributes)) {
        params.append(`MessageAttribute.${attrIndex}.Name`, key)
        params.append(`MessageAttribute.${attrIndex}.Value.DataType`, value.DataType)
        if (value.StringValue) {
          params.append(`MessageAttribute.${attrIndex}.Value.StringValue`, value.StringValue)
        }
        attrIndex++
      }
    }

    const queryString = params.toString().replace(/&/g, '&')
    const response = await api.get(`/sqs?Action=SendMessage&${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<SendMessageResponse>(xmlData)
    
    return {
      MessageId: parsed?.SendMessageResult?.MessageId || '',
      MD5OfBody: parsed?.SendMessageResult?.MD5OfMessageBody || ''
    }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * Receive messages from a queue
 */
export async function receiveMessages(
  queueUrl: string,
  options?: {
    maxMessages?: number
    visibilityTimeout?: number
    waitTimeSeconds?: number
  }
): Promise<SQSMessage[]> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    
    if (options?.maxMessages) {
      params.append('MaxNumberOfMessages', String(options.maxMessages))
    }
    if (options?.visibilityTimeout) {
      params.append('VisibilityTimeout', String(options.visibilityTimeout))
    }
    if (options?.waitTimeSeconds) {
      params.append('WaitTimeSeconds', String(options.waitTimeSeconds))
    }

    const queryString = params.toString().replace(/&/g, '&')
    const response = await api.get(`/sqs?Action=ReceiveMessage&${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ReceiveMessageResponse>(xmlData)
    
    if (!parsed?.ReceiveMessageResult?.Message) {
      return []
    }

    const messages = parsed.ReceiveMessageResult.Message
    const msgArray = Array.isArray(messages) ? messages : [messages]
    
    return msgArray.map((msg) => {
      const attributes: Record<string, string> = {}
      if (msg.Attributes?.Entry) {
        const entries = Array.isArray(msg.Attributes.Entry) 
          ? msg.Attributes.Entry 
          : [msg.Attributes.Entry]
        entries.forEach((entry) => {
          attributes[entry.Name] = entry.Value
        })
      }

      const messageAttributes: SQSMessage['MessageAttributes'] = {}
      if (msg.MessageAttributes?.Entry) {
        const entries = Array.isArray(msg.MessageAttributes.Entry)
          ? msg.MessageAttributes.Entry
          : [msg.MessageAttributes.Entry]
        entries.forEach((entry) => {
          messageAttributes[entry.Name] = entry
        })
      }

      return {
        MessageId: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
        MD5OfBody: msg.MD5OfBody,
        Body: msg.Body,
        Attributes: attributes,
        MessageAttributes: messageAttributes
      }
    })
  } catch (error) {
    console.error('Error receiving messages:', error)
    throw error
  }
}

/**
 * Delete a message from a queue
 */
export async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
  try {
    await api.get(
      `/sqs?Action=DeleteMessage&QueueUrl=${encodeURIComponent(queueUrl)}&ReceiptHandle=${encodeURIComponent(receiptHandle)}`
    )
  } catch (error) {
    console.error('Error deleting message:', error)
    throw error
  }
}

/**
 * Delete multiple messages from a queue
 */
export async function deleteMessages(queueUrl: string, receiptHandles: string[]): Promise<void> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    
    receiptHandles.forEach((handle, index) => {
      params.append(`Entries.${index + 1}.Id`, String(index + 1))
      params.append(`Entries.${index + 1}.ReceiptHandle`, handle)
    })

    const queryString = params.toString().replace(/&/g, '&')
    await api.get(`/sqs?Action=DeleteMessageBatch&${queryString}`)
  } catch (error) {
    console.error('Error deleting messages:', error)
    throw error
  }
}

/**
 * Purge all messages from a queue
 */
export async function purgeQueue(queueUrl: string): Promise<void> {
  try {
    await api.get(`/sqs?Action=PurgeQueue&QueueUrl=${encodeURIComponent(queueUrl)}`)
  } catch (error) {
    console.error('Error purging queue:', error)
    throw error
  }
}

/**
 * List dead letter source queues for a given queue
 */
export async function listDeadLetterSourceQueues(queueUrl: string): Promise<string[]> {
  try {
    const response = await api.get(
      `/sqs?Action=ListDeadLetterSourceQueues&QueueUrl=${encodeURIComponent(queueUrl)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListDeadLetterSourceQueuesResponse>(xmlData)
    
    if (parsed?.ListDeadLetterSourceQueuesResult?.QueueUrl) {
      const urls = parsed.ListDeadLetterSourceQueuesResult.QueueUrl
      return Array.isArray(urls) ? urls : [urls]
    }
    
    return []
  } catch (error) {
    console.error('Error listing dead letter source queues:', error)
    throw error
  }
}

/**
 * Set queue attributes
 */
export async function setQueueAttributes(
  queueUrl: string,
  attributes: Record<string, string>
): Promise<void> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    
    Object.entries(attributes).forEach(([key, value], index) => {
      params.append(`Attribute.${index + 1}.Name`, key)
      params.append(`Attribute.${index + 1}.Value`, value)
    })

    const queryString = params.toString().replace(/&/g, '&')
    await api.get(`/sqs?Action=SetQueueAttributes&${queryString}`)
  } catch (error) {
    console.error('Error setting queue attributes:', error)
    throw error
  }
}

/**
 * Add permission to a queue
 */
export async function addPermission(
  queueUrl: string,
  label: string,
  awsAccountIds: string[],
  actions: string[]
): Promise<void> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    params.append('Label', label)
    
    awsAccountIds.forEach((id, index) => {
      params.append(`AWSAccountId.${index + 1}`, id)
    })
    
    actions.forEach((action, index) => {
      params.append(`ActionName.${index + 1}`, action)
    })

    const queryString = params.toString().replace(/&/g, '&')
    await api.get(`/sqs?Action=AddPermission&${queryString}`)
  } catch (error) {
    console.error('Error adding permission:', error)
    throw error
  }
}

/**
 * Remove permission from a queue
 */
export async function removePermission(queueUrl: string, label: string): Promise<void> {
  try {
    await api.get(
      `/sqs?Action=RemovePermission&QueueUrl=${encodeURIComponent(queueUrl)}&Label=${encodeURIComponent(label)}`
    )
  } catch (error) {
    console.error('Error removing permission:', error)
    throw error
  }
}

/**
 * Tag a queue
 */
export async function tagQueue(queueUrl: string, tags: Record<string, string>): Promise<void> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    
    Object.entries(tags).forEach(([key, value], index) => {
      params.append(`Tag.${index + 1}.Key`, key)
      params.append(`Tag.${index + 1}.Value`, value)
    })

    const queryString = params.toString().replace(/&/g, '&')
    await api.get(`/sqs?Action=TagQueue&${queryString}`)
  } catch (error) {
    console.error('Error tagging queue:', error)
    throw error
  }
}

/**
 * Untag a queue
 */
export async function untagQueue(queueUrl: string, tagKeys: string[]): Promise<void> {
  try {
    const params = new URLSearchParams()
    params.append('QueueUrl', queueUrl)
    
    tagKeys.forEach((key, index) => {
      params.append(`TagKey.${index + 1}`, key)
    })

    const queryString = params.toString().replace(/&/g, '&')
    await api.get(`/sqs?Action=UntagQueue&${queryString}`)
  } catch (error) {
    console.error('Error untagging queue:', error)
    throw error
  }
}

/**
 * List queue tags
 */
export async function listQueueTags(queueUrl: string): Promise<Record<string, string>> {
  try {
    const response = await api.get(
      `/sqs?Action=ListQueueTags&QueueUrl=${encodeURIComponent(queueUrl)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<{ ListQueueTagsResult?: { Tag?: Array<{ Key: string; Value: string }> } }>(xmlData)
    
    const tags: Record<string, string> = {}
    if (parsed?.ListQueueTagsResult?.Tag) {
      const tagArray = parsed.ListQueueTagsResult.Tag
      const tagsList = Array.isArray(tagArray) ? tagArray : [tagArray]
      tagsList.forEach((tag) => {
        tags[tag.Key] = tag.Value
      })
    }
    
    return tags
  } catch (error) {
    console.error('Error listing queue tags:', error)
    throw error
  }
}
