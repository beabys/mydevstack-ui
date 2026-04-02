/**
 * SSM Parameter Store Service API Client
 * AWS SDK v3 implementation for AWS Systems Manager Parameter Store
 * @module api/services/ssm
 */

import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
  GetParametersByPathCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DescribeParametersCommand,
  GetParameterHistoryCommand,
  ListTagsForResourceCommand,
  AddTagsToResourceCommand,
  RemoveTagsFromResourceCommand,
  type GetParameterCommandOutput,
  type GetParametersCommandOutput,
  type GetParametersByPathCommandOutput,
  type PutParameterCommandOutput,
  type DescribeParametersCommandOutput,
  type GetParameterHistoryCommandOutput,
} from '@aws-sdk/client-ssm'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let ssmClient: SSMClient | null = null

function getSSMClient(): SSMClient {
  const settingsStore = useSettingsStore()
  
  if (!ssmClient) {
    ssmClient = new SSMClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return ssmClient
}

export function refreshSSMClient(): void {
  ssmClient = null
  getSSMClient()
}

export class SSMService {
  private getClient(): SSMClient {
    return getSSMClient()
  }

  async getParameter(name: string, options?: { WithDecryption?: boolean }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetParameterCommand({
        Name: name,
        WithDecryption: options?.WithDecryption,
      })
      const response: GetParameterCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get parameter: ${name}`, 500, 'ssm')
    }
  }

  async getParameters(names: string[], options?: { WithDecryption?: boolean }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetParametersCommand({
        Names: names,
        WithDecryption: options?.WithDecryption,
      })
      const response: GetParametersCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get parameters', 500, 'ssm')
    }
  }

  async getParametersByPath(path: string, options?: {
    WithDecryption?: boolean
    Recursive?: boolean
    NextToken?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetParametersByPathCommand({
        Path: path,
        ...options,
      } as any)
      const response: GetParametersByPathCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get parameters by path: ${path}`, 500, 'ssm')
    }
  }

  async putParameter(params: {
    Name: string
    Value: string
    Type: 'String' | 'SecureString' | 'StringList'
    Description?: string
    Overwrite?: boolean
    AllowedPattern?: string
    Tier?: 'Standard' | 'Advanced' | 'Intelligent-Tiering'
    DataType?: string
    Policies?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutParameterCommand(params as any)
      const response: PutParameterCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put parameter: ${params.Name}`, 500, 'ssm')
    }
  }

  async deleteParameter(name: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteParameterCommand({ Name: name })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete parameter: ${name}`, 500, 'ssm')
    }
  }

  async describeParameters(options?: {
    ParameterFilters?: any[]
    NextToken?: string
    MaxResults?: number
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeParametersCommand(options as any)
      const response: DescribeParametersCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe parameters', 500, 'ssm')
    }
  }

  async getParameterHistory(name: string, options?: { WithDecryption?: boolean; MaxResults?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetParameterHistoryCommand({
        Name: name,
        ...options,
      } as any)
      const response: GetParameterHistoryCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get parameter history: ${name}`, 500, 'ssm')
    }
  }

  async listTagsForResource(resourceType: string, resourceId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListTagsForResourceCommand({
        ResourceType: resourceType as any,
        ResourceId: resourceId,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list tags for resource: ${resourceId}`, 500, 'ssm')
    }
  }

  async addTagsToResource(resourceType: string, resourceId: string, tags: Record<string, string>): Promise<any> {
    try {
      const client = this.getClient()
      const tagArray = Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
      const command = new AddTagsToResourceCommand({
        ResourceType: resourceType as any,
        ResourceId: resourceId,
        Tags: tagArray,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to add tags to resource: ${resourceId}`, 500, 'ssm')
    }
  }

  async removeTagsFromResource(resourceType: string, resourceId: string, keys: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new RemoveTagsFromResourceCommand({
        ResourceType: resourceType as any,
        ResourceId: resourceId,
        TagKeys: keys,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to remove tags from resource: ${resourceId}`, 500, 'ssm')
    }
  }
}

export const ssmService = new SSMService()

export const getParameter = (name: string, options?: any) => ssmService.getParameter(name, options)
export const getParameters = (names: string[], options?: any) => ssmService.getParameters(names, options)
export const getParametersByPath = (path: string, options?: any) => ssmService.getParametersByPath(path, options)
export const putParameter = (params: any) => ssmService.putParameter(params)
export const deleteParameter = (name: string) => ssmService.deleteParameter(name)
export const describeParameters = (options?: any) => ssmService.describeParameters(options)
export const getParameterHistory = (name: string, options?: any) => ssmService.getParameterHistory(name, options)
export const listTagsForResource = (resourceType: string, resourceId: string) => 
  ssmService.listTagsForResource(resourceType, resourceId)
export const addTagsToResource = (resourceType: string, resourceId: string, tags: Record<string, string>) => 
  ssmService.addTagsToResource(resourceType, resourceId, tags)
export const removeTagsFromResource = (resourceType: string, resourceId: string, keys: string[]) => 
  ssmService.removeTagsFromResource(resourceType, resourceId, keys)

export default ssmService
