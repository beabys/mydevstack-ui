/**
 * SNS Service API Client
 * AWS SDK v3 implementation for SNS
 * @module api/services/sns
 */

import {
  SNSClient,
  ListTopicsCommand,
  ListSubscriptionsCommand,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  PublishCommand,
  ConfirmSubscriptionCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand,
  ListTagsForResourceCommand,
  type ListTopicsCommandOutput,
  type ListSubscriptionsCommandOutput,
  type ListSubscriptionsByTopicCommandOutput,
  type GetTopicAttributesCommandOutput,
  type CreateTopicCommandOutput,
  type SubscribeCommandOutput,
  type PublishCommandOutput,
  type ConfirmSubscriptionCommandOutput,
} from '@aws-sdk/client-sns'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let snsClient: SNSClient | null = null

function getSNSClient(): SNSClient {
  const settingsStore = useSettingsStore()
  
  if (!snsClient) {
    snsClient = new SNSClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return snsClient
}

export function refreshSNSClient(): void {
  snsClient = null
  getSNSClient()
}

export class SNSService {
  private getClient(): SNSClient {
    return getSNSClient()
  }

  async listTopics(): Promise<any[]> {
    try {
      const client = this.getClient()
      const command = new ListTopicsCommand({})
      const response: ListTopicsCommandOutput = await client.send(command)
      return response.Topics || []
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list topics', 500, 'sns')
    }
  }

  async listSubscriptions(): Promise<any[]> {
    try {
      const client = this.getClient()
      const command = new ListSubscriptionsCommand({})
      const response: ListSubscriptionsCommandOutput = await client.send(command)
      return response.Subscriptions || []
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list subscriptions', 500, 'sns')
    }
  }

  async listSubscriptionsByTopic(topicArn: string): Promise<any[]> {
    try {
      const client = this.getClient()
      const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      const response: ListSubscriptionsByTopicCommandOutput = await client.send(command)
      return response.Subscriptions || []
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list subscriptions for topic: ${topicArn}`, 500, 'sns')
    }
  }

  async getTopicAttributes(topicArn: string): Promise<Record<string, string>> {
    try {
      const client = this.getClient()
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn })
      const response: GetTopicAttributesCommandOutput = await client.send(command)
      
      const attrs: Record<string, string> = {}
      if (response.Attributes) {
        Object.entries(response.Attributes).forEach(([key, value]) => {
          attrs[key] = String(value)
        })
      }
      return attrs
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get topic attributes: ${topicArn}`, 500, 'sns')
    }
  }

  async createTopic(name: string, options?: {
    DisplayName?: string
    Attributes?: Record<string, string>
    tags?: Record<string, string>
  }): Promise<{ TopicArn: string }> {
    try {
      const client = this.getClient()
      const command = new CreateTopicCommand({
        Name: name,
        DisplayName: options?.DisplayName,
        ...options,
      })
      const response: CreateTopicCommandOutput = await client.send(command)
      return { TopicArn: response.TopicArn || '' }
    } catch (error) {
      console.error('CreateTopic error:', error)
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create topic: ${name}`, 500, 'sns')
    }
  }

  async deleteTopic(topicArn: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteTopicCommand({ TopicArn: topicArn })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete topic: ${topicArn}`, 500, 'sns')
    }
  }

  async subscribe(topicArn: string, protocol: string, endpoint: string): Promise<{ SubscriptionArn: string }> {
    try {
      const client = this.getClient()
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: protocol,
        Endpoint: endpoint,
      })
      const response: SubscribeCommandOutput = await client.send(command)
      return { SubscriptionArn: response.SubscriptionArn || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to subscribe to topic: ${topicArn}`, 500, 'sns')
    }
  }

  async unsubscribe(subscriptionArn: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new UnsubscribeCommand({ SubscriptionArn: subscriptionArn })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to unsubscribe: ${subscriptionArn}`, 500, 'sns')
    }
  }

  async publish(topicArn: string, message: string, options?: {
    Subject?: string
    MessageStructure?: string
    MessageAttributes?: Record<string, any>
    TargetArn?: string
    PhoneNumber?: string
  }): Promise<{ MessageId: string }> {
    try {
      const client = this.getClient()
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        ...options,
      })
      const response: PublishCommandOutput = await client.send(command)
      return { MessageId: response.MessageId || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to publish message to topic: ${topicArn}`, 500, 'sns')
    }
  }

  async confirmSubscription(topicArn: string, token: string): Promise<{ SubscriptionArn: string }> {
    try {
      const client = this.getClient()
      const command = new ConfirmSubscriptionCommand({
        TopicArn: topicArn,
        Token: token,
      })
      const response: ConfirmSubscriptionCommandOutput = await client.send(command)
      return { SubscriptionArn: response.SubscriptionArn || '' }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to confirm subscription: ${topicArn}`, 500, 'sns')
    }
  }

  async getSubscriptionAttributes(subscriptionArn: string): Promise<Record<string, string>> {
    try {
      const client = this.getClient()
      const command = new GetSubscriptionAttributesCommand({ SubscriptionArn: subscriptionArn })
      const response = await client.send(command)
      
      const attrs: Record<string, string> = {}
      if (response.Attributes) {
        Object.entries(response.Attributes).forEach(([key, value]) => {
          attrs[key] = String(value)
        })
      }
      return attrs
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get subscription attributes: ${subscriptionArn}`, 500, 'sns')
    }
  }

  async setSubscriptionAttributes(subscriptionArn: string, attributeName: string, attributeValue: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new SetSubscriptionAttributesCommand({
        SubscriptionArn: subscriptionArn,
        AttributeName: attributeName,
        AttributeValue: attributeValue,
      })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to set subscription attributes: ${subscriptionArn}`, 500, 'sns')
    }
  }

  async listTagsForResource(resourceArn: string): Promise<{ Tags: any[] }> {
    try {
      const client = this.getClient()
      const command = new ListTagsForResourceCommand({ ResourceArn: resourceArn })
      const response = await client.send(command)
      return { Tags: response.Tags || [] }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list tags for resource: ${resourceArn}`, 500, 'sns')
    }
  }
}

export const snsService = new SNSService()

export const listTopics = () => snsService.listTopics()
export const listSubscriptions = () => snsService.listSubscriptions()
export const listSubscriptionsByTopic = (topicArn: string) => snsService.listSubscriptionsByTopic(topicArn)
export const getTopicAttributes = (topicArn: string) => snsService.getTopicAttributes(topicArn)
export const createTopic = (name: string, options?: Parameters<SNSService['createTopic']>[1]) => 
  snsService.createTopic(name, options)
export const deleteTopic = (topicArn: string) => snsService.deleteTopic(topicArn)
export const subscribe = (topicArn: string, protocol: string, endpoint: string) => 
  snsService.subscribe(topicArn, protocol, endpoint)
export const unsubscribe = (subscriptionArn: string) => snsService.unsubscribe(subscriptionArn)
export const publish = (topicArn: string, message: string, options?: Parameters<SNSService['publish']>[2]) => 
  snsService.publish(topicArn, message, options)
export const confirmSubscription = (topicArn: string, token: string) => 
  snsService.confirmSubscription(topicArn, token)
export const getSubscriptionAttributes = (subscriptionArn: string) => 
  snsService.getSubscriptionAttributes(subscriptionArn)
export const setSubscriptionAttributes = (subscriptionArn: string, attributeName: string, attributeValue: string) => 
  snsService.setSubscriptionAttributes(subscriptionArn, attributeName, attributeValue)
export const listTagsForResource = (resourceArn: string) => snsService.listTagsForResource(resourceArn)

export default snsService
