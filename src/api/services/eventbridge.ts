/**
 * EventBridge Service API Client
 * AWS SDK v3 implementation for Amazon EventBridge
 * @module api/services/eventbridge
 */

import {
  EventBridgeClient,
  CreateEventBusCommand,
  DescribeEventBusCommand,
  ListEventBusesCommand,
  DeleteEventBusCommand,
  PutRuleCommand,
  DescribeRuleCommand,
  ListRulesCommand,
  DeleteRuleCommand,
  EnableRuleCommand,
  DisableRuleCommand,
  PutTargetsCommand,
  ListTargetsByRuleCommand,
  RemoveTargetsCommand,
  PutEventsCommand,
  ListEventSourcesCommand,
  DescribeEventSourceCommand,
  type CreateEventBusCommandOutput,
  type DescribeEventBusCommandOutput,
  type ListEventBusesCommandOutput,
  type PutRuleCommandOutput,
  type DescribeRuleCommandOutput,
  type ListRulesCommandOutput,
  type PutTargetsCommandOutput,
  type ListTargetsByRuleCommandOutput,
  type PutEventsCommandOutput,
  type ListEventSourcesCommandOutput,
} from '@aws-sdk/client-eventbridge'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let eventBridgeClient: EventBridgeClient | null = null

function getEventBridgeClient(): EventBridgeClient {
  const settingsStore = useSettingsStore()
  
  if (!eventBridgeClient) {
    eventBridgeClient = new EventBridgeClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return eventBridgeClient
}

export function refreshEventBridgeClient(): void {
  eventBridgeClient = null
  getEventBridgeClient()
}

export class EventBridgeService {
  private getClient(): EventBridgeClient {
    return getEventBridgeClient()
  }

  async createEventBus(name: string, options?: {
    Description?: string
    KmsKeyIdentifier?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateEventBusCommand({ Name: name, ...options } as any)
      const response: CreateEventBusCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create event bus: ${name}`, 500, 'eventbridge')
    }
  }

  async describeEventBus(name: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeEventBusCommand({ Name: name })
      const response: DescribeEventBusCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe event bus: ${name}`, 500, 'eventbridge')
    }
  }

  async listEventBuses(options?: { Limit?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListEventBusesCommand(options as any)
      const response: ListEventBusesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list event buses', 500, 'eventbridge')
    }
  }

  async deleteEventBus(name: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteEventBusCommand({ Name: name })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete event bus: ${name}`, 500, 'eventbridge')
    }
  }

  async putRule(params: {
    Name: string
    EventBusName?: string
    EventPattern?: string
    ScheduleExpression?: string
    State?: 'ENABLED' | 'DISABLED'
    Description?: string
    RoleArn?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutRuleCommand(params as any)
      const response: PutRuleCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put rule: ${params.Name}`, 500, 'eventbridge')
    }
  }

  async describeRule(name: string, eventBusName?: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeRuleCommand({ Name: name, EventBusName: eventBusName } as any)
      const response: DescribeRuleCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe rule: ${name}`, 500, 'eventbridge')
    }
  }

  async listRules(eventBusName?: string, options?: { Limit?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListRulesCommand({ EventBusName: eventBusName, ...options } as any)
      const response: ListRulesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list rules', 500, 'eventbridge')
    }
  }

  async deleteRule(name: string, eventBusName?: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteRuleCommand({ Name: name, EventBusName: eventBusName } as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete rule: ${name}`, 500, 'eventbridge')
    }
  }

  async enableRule(name: string, eventBusName?: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new EnableRuleCommand({ Name: name, EventBusName: eventBusName } as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to enable rule: ${name}`, 500, 'eventbridge')
    }
  }

  async disableRule(name: string, eventBusName?: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DisableRuleCommand({ Name: name, EventBusName: eventBusName } as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to disable rule: ${name}`, 500, 'eventbridge')
    }
  }

  async putTargets(params: {
    Rule: string
    EventBusName?: string
    Targets: Array<{ Id: string; Arn: string; RoleArn?: string; Input?: string; InputPath?: string }>
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutTargetsCommand(params as any)
      const response: PutTargetsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put targets for rule: ${params.Rule}`, 500, 'eventbridge')
    }
  }

  async listTargetsByRule(rule: string, eventBusName?: string, options?: { Limit?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListTargetsByRuleCommand({ Rule: rule, EventBusName: eventBusName, ...options } as any)
      const response: ListTargetsByRuleCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list targets for rule: ${rule}`, 500, 'eventbridge')
    }
  }

  async removeTargets(params: {
    Rule: string
    EventBusName?: string
    Ids: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new RemoveTargetsCommand(params as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to remove targets for rule: ${params.Rule}`, 500, 'eventbridge')
    }
  }

  async putEvents(entries: Array<{
    Source?: string
    DetailType?: string
    Detail?: string
    EventBusName?: string
  }>): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutEventsCommand({ Entries: entries } as any)
      const response: PutEventsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to put events', 500, 'eventbridge')
    }
  }

  async listEventSources(options?: { Limit?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListEventSourcesCommand(options as any)
      const response: ListEventSourcesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list event sources', 500, 'eventbridge')
    }
  }

  async describeEventSource(name: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeEventSourceCommand({ Name: name })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe event source: ${name}`, 500, 'eventbridge')
    }
  }
}

export const eventBridgeService = new EventBridgeService()

export const createEventBus = (name: string, options?: Parameters<EventBridgeService['createEventBus']>[1]) => 
  eventBridgeService.createEventBus(name, options)
export const describeEventBus = (name: string) => eventBridgeService.describeEventBus(name)
export const listEventBuses = (options?: Parameters<EventBridgeService['listEventBuses']>[0]) => 
  eventBridgeService.listEventBuses(options)
export const deleteEventBus = (name: string) => eventBridgeService.deleteEventBus(name)
export const putRule = (params: Parameters<EventBridgeService['putRule']>[0]) => eventBridgeService.putRule(params)
export const describeRule = (name: string, eventBusName?: string) => eventBridgeService.describeRule(name, eventBusName)
export const listRules = (eventBusName?: string, options?: Parameters<EventBridgeService['listRules']>[1]) => 
  eventBridgeService.listRules(eventBusName, options)
export const deleteRule = (name: string, eventBusName?: string) => eventBridgeService.deleteRule(name, eventBusName)
export const enableRule = (name: string, eventBusName?: string) => eventBridgeService.enableRule(name, eventBusName)
export const disableRule = (name: string, eventBusName?: string) => eventBridgeService.disableRule(name, eventBusName)
export const putTargets = (params: Parameters<EventBridgeService['putTargets']>[0]) => eventBridgeService.putTargets(params)
export const listTargetsByRule = (rule: string, eventBusName?: string, options?: Parameters<EventBridgeService['listTargetsByRule']>[2]) => 
  eventBridgeService.listTargetsByRule(rule, eventBusName, options)
export const removeTargets = (params: Parameters<EventBridgeService['removeTargets']>[0]) => eventBridgeService.removeTargets(params)
export const putEvents = (entries: Parameters<EventBridgeService['putEvents']>[0]) => eventBridgeService.putEvents(entries)
export const listEventSources = (options?: Parameters<EventBridgeService['listEventSources']>[0]) => 
  eventBridgeService.listEventSources(options)
export const describeEventSource = (name: string) => eventBridgeService.describeEventSource(name)

export default eventBridgeService
