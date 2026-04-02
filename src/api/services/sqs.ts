/**
 * SQS Service API Client
 * AWS SDK v3 implementation for SQS
 * @module api/services/sqs
 */

import {
  SQSClient,
  ListQueuesCommand,
  GetQueueUrlCommand,
  GetQueueAttributesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  PurgeQueueCommand,
  SetQueueAttributesCommand,
  ChangeMessageVisibilityCommand,
  type ListQueuesCommandOutput,
  type GetQueueUrlCommandOutput,
  type GetQueueAttributesCommandOutput,
  type CreateQueueCommandOutput,
  type SendMessageCommandOutput,
  type ReceiveMessageCommandOutput,
  type DeleteMessageCommandOutput,
} from '@aws-sdk/client-sqs'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let sqsClient: SQSClient | null = null

function getSQSClient(): SQSClient {
  const settingsStore = useSettingsStore()
  
  if (!sqsClient) {
    sqsClient = new SQSClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return sqsClient
}

export function refreshSQSClient(): void {
  sqsClient = null
  getSQSClient()
}

export class SQSService {
  private getClient(): SQSClient {
    return getSQSClient()
  }

  async listQueues(prefix?: string): Promise<string[]> {
    try {
      const client = this.getClient()
      const command = new ListQueuesCommand({ QueueNamePrefix: prefix })
      const response: ListQueuesCommandOutput = await client.send(command)
      return response.QueueUrls || []
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list queues', 500, 'sqs')
    }
  }

  async getQueueUrl(queueName: string): Promise<string | undefined> {
    try {
      const client = this.getClient()
      const command = new GetQueueUrlCommand({ QueueName: queueName })
      const response: GetQueueUrlCommandOutput = await client.send(command)
      return response.QueueUrl
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get queue URL: ${queueName}`, 500, 'sqs')
    }
  }

  async getQueueAttributes(queueUrl: string, attributeNames: string[] = ['All']): Promise<Record<string, string>> {
    try {
      const client = this.getClient()
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: attributeNames as any,
      })
      const response: GetQueueAttributesCommandOutput = await client.send(command)
      
      const attributes: Record<string, string> = {}
      if (response.Attributes) {
        Object.entries(response.Attributes).forEach(([key, value]) => {
          attributes[key] = String(value)
        })
      }
      return attributes
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get queue attributes: ${queueUrl}`, 500, 'sqs')
    }
  }

  async createQueue(queueName: string, options?: {
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ QueueUrl: string }> {
    try {
      const client = this.getClient()
      const command = new CreateQueueCommand({
        QueueName: queueName,
        ...options,
      })
      const response: CreateQueueCommandOutput = await client.send(command)
      return { QueueUrl: response.QueueUrl || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create queue: ${queueName}`, 500, 'sqs')
    }
  }

  async deleteQueue(queueUrl: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteQueueCommand({ QueueUrl: queueUrl })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete queue: ${queueUrl}`, 500, 'sqs')
    }
  }

  async sendMessage(queueUrl: string, messageBody: string, options?: {
    DelaySeconds?: number
    MessageAttributes?: Record<string, any>
    MessageDeduplicationId?: string
    MessageGroupId?: string
  }): Promise<{ MessageId: string; MD5OfMessageBody: string }> {
    try {
      const client = this.getClient()
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        ...options,
      })
      const response: SendMessageCommandOutput = await client.send(command)
      return {
        MessageId: response.MessageId || '',
        MD5OfMessageBody: response.MD5OfMessageBody || '',
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to send message to queue: ${queueUrl}`, 500, 'sqs')
    }
  }

  async receiveMessage(queueUrl: string, options?: {
    MaxNumberOfMessages?: number
    WaitTimeSeconds?: number
    VisibilityTimeout?: number
    AttributeNames?: any[]
    MessageAttributeNames?: any[]
  }): Promise<any[]> {
    try {
      const client = this.getClient()
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        ...options,
      })
      const response: ReceiveMessageCommandOutput = await client.send(command)
      return response.Messages || []
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to receive messages from queue: ${queueUrl}`, 500, 'sqs')
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to delete message', 500, 'sqs')
    }
  }

  async purgeQueue(queueUrl: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new PurgeQueueCommand({ QueueUrl: queueUrl })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to purge queue: ${queueUrl}`, 500, 'sqs')
    }
  }

  async setQueueAttributes(queueUrl: string, attributes: Record<string, string>): Promise<void> {
    try {
      const client = this.getClient()
      const command = new SetQueueAttributesCommand({
        QueueUrl: queueUrl,
        Attributes: attributes,
      })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to set queue attributes: ${queueUrl}`, 500, 'sqs')
    }
  }

  async changeMessageVisibility(queueUrl: string, receiptHandle: string, visibilityTimeout: number): Promise<void> {
    try {
      const client = this.getClient()
      const command = new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: visibilityTimeout,
      })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to change message visibility', 500, 'sqs')
    }
  }
}

export const sqsService = new SQSService()

export const listQueues = (prefix?: string) => sqsService.listQueues(prefix)
export const getQueueUrl = (queueName: string) => sqsService.getQueueUrl(queueName)
export const getQueueAttributes = (queueUrl: string, attributeNames?: string[]) => 
  sqsService.getQueueAttributes(queueUrl, attributeNames)
export const createQueue = (queueName: string, options?: Parameters<SQSService['createQueue']>[1]) => 
  sqsService.createQueue(queueName, options)
export const deleteQueue = (queueUrl: string) => sqsService.deleteQueue(queueUrl)
export const sendMessage = (queueUrl: string, messageBody: string, options?: Parameters<SQSService['sendMessage']>[2]) => 
  sqsService.sendMessage(queueUrl, messageBody, options)
export const receiveMessage = (queueUrl: string, options?: Parameters<SQSService['receiveMessage']>[1]) => 
  sqsService.receiveMessage(queueUrl, options)
export const deleteMessage = (queueUrl: string, receiptHandle: string) => 
  sqsService.deleteMessage(queueUrl, receiptHandle)
export const purgeQueue = (queueUrl: string) => sqsService.purgeQueue(queueUrl)
export const setQueueAttributes = (queueUrl: string, attributes: Record<string, string>) => 
  sqsService.setQueueAttributes(queueUrl, attributes)
export const changeMessageVisibility = (queueUrl: string, receiptHandle: string, visibilityTimeout: number) => 
  sqsService.changeMessageVisibility(queueUrl, receiptHandle, visibilityTimeout)

export default sqsService
