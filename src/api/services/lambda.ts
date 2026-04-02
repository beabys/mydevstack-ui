/**
 * Lambda Service API Client
 * AWS SDK v3 implementation for AWS Lambda
 * @module api/services/lambda
 */

import {
  LambdaClient,
  ListFunctionsCommand,
  CreateFunctionCommand,
  GetFunctionCommand,
  DeleteFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
  GetEventSourceMappingCommand,
  CreateEventSourceMappingCommand,
  type ListFunctionsCommandOutput,
  type CreateFunctionCommandOutput,
  type GetFunctionCommandOutput,
  type UpdateFunctionCodeCommandOutput,
  type UpdateFunctionConfigurationCommandOutput,
  type InvokeCommandOutput,
  type ListEventSourceMappingsCommandOutput,
  type GetEventSourceMappingCommandOutput,
  type CreateEventSourceMappingCommandOutput,
} from '@aws-sdk/client-lambda'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let lambdaClient: LambdaClient | null = null

function getLambdaClient(): LambdaClient {
  const settingsStore = useSettingsStore()
  const endpoint = settingsStore.endpoint

  lambdaClient = new LambdaClient({
    endpoint,
    region: settingsStore.region,
    credentials: {
      accessKeyId: settingsStore.accessKey,
      secretAccessKey: settingsStore.secretKey,
    },
    tls: false,
  })

  return lambdaClient
}

export function refreshLambdaClient(): void {
  lambdaClient = null
  getLambdaClient()
}

export class LambdaService {
  private getClient(): LambdaClient {
    return getLambdaClient()
  }

  async listFunctions(options?: {
    Marker?: string
    MaxItems?: number
    MasterRegion?: string
  }): Promise<{ functions: any[]; nextMarker?: string }> {
    try {
      const client = this.getClient()
      const command = new ListFunctionsCommand({
        Marker: options?.Marker,
        MaxItems: options?.MaxItems,
        MasterRegion: options?.MasterRegion,
      })
      const response: ListFunctionsCommandOutput = await client.send(command)
      
      return {
        functions: response.Functions || [],
        nextMarker: response.NextMarker,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list functions', 500, 'lambda')
    }
  }

  async createFunction(request: {
    FunctionName: string
    Runtime: any
    Role: string
    Handler: string
    Code: { ZipFile?: Uint8Array; S3Bucket?: string; S3Key?: string; S3ObjectVersion?: string }
    Description?: string
    Timeout?: number
    MemorySize?: number
    Publish?: boolean
    Environment?: { Variables: Record<string, string> }
    TracingConfig?: { Mode: 'PassThrough' | 'Active' }
    Layers?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateFunctionCommand(request)
      const response: CreateFunctionCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create function: ${request.FunctionName}`, 500, 'lambda')
    }
  }

  async getFunction(functionName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetFunctionCommand({ FunctionName: functionName })
      const response: GetFunctionCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get function: ${functionName}`, 500, 'lambda')
    }
  }

  async getFunctionConfiguration(functionName: string): Promise<any> {
    const result = await this.getFunction(functionName)
    return result.Configuration
  }

  async deleteFunction(functionName: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteFunctionCommand({ FunctionName: functionName })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete function: ${functionName}`, 500, 'lambda')
    }
  }

  async updateFunctionCode(
    functionName: string,
    options: {
      ZipFile?: Uint8Array
      S3Bucket?: string
      S3Key?: string
      S3ObjectVersion?: string
      DryRun?: boolean
      Publish?: boolean
    }
  ): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateFunctionCodeCommand({
        FunctionName: functionName,
        ...options,
      })
      const response: UpdateFunctionCodeCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update function code: ${functionName}`, 500, 'lambda')
    }
  }

  async updateFunctionConfiguration(
    functionName: string,
    options: {
      Description?: string
      Handler?: string
      MemorySize?: number
      Runtime?: any
      Timeout?: number
      Environment?: { Variables: Record<string, string> }
      TracingConfig?: { Mode: 'PassThrough' | 'Active' }
    }
  ): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateFunctionConfigurationCommand({
        FunctionName: functionName,
        ...options,
      })
      const response: UpdateFunctionConfigurationCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update function configuration: ${functionName}`, 500, 'lambda')
    }
  }

  async invoke(
    functionName: string,
    payload?: unknown,
    options?: {
      invocationType?: 'RequestResponse' | 'Event' | 'DryRun'
      logType?: 'None' | 'Tail'
      clientContext?: string
    }
  ): Promise<{ Payload?: string; StatusCode: number; FunctionError?: string; LogResult?: string }> {
    try {
      const client = this.getClient()
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: options?.invocationType,
        LogType: options?.logType,
        ClientContext: options?.clientContext ? Buffer.from(options.clientContext).toString('base64') : undefined,
        Payload: payload ? JSON.stringify(payload) : undefined,
      })
      
      const response: InvokeCommandOutput = await client.send(command)
      
      let payloadStr = ''
      if (response.Payload) {
        payloadStr = await response.Payload.transformToString()
      }
      
      return {
        Payload: payloadStr,
        StatusCode: response.StatusCode || 0,
        FunctionError: response.FunctionError,
        LogResult: response.LogResult ? Buffer.from(response.LogResult).toString('utf-8') : undefined,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to invoke function: ${functionName}`, 500, 'lambda')
    }
  }

  async getEventSourceMapping(uuid: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetEventSourceMappingCommand({ UUID: uuid })
      const response: GetEventSourceMappingCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get event source mapping: ${uuid}`, 500, 'lambda')
    }
  }

  async listEventSourceMappings(options?: {
    EventSourceArn?: string
    FunctionName?: string
    Marker?: string
    MaxItems?: number
  }): Promise<{ EventSourceMappings: any[]; NextMarker?: string }> {
    try {
      const client = this.getClient()
      const command = new ListEventSourceMappingsCommand({
        EventSourceArn: options?.EventSourceArn,
        FunctionName: options?.FunctionName,
        Marker: options?.Marker,
        MaxItems: options?.MaxItems,
      })
      const response: ListEventSourceMappingsCommandOutput = await client.send(command)
      
      return {
        EventSourceMappings: response.EventSourceMappings || [],
        NextMarker: response.NextMarker,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list event source mappings', 500, 'lambda')
    }
  }

  async createEventSourceMapping(options: {
    EventSourceArn: string
    FunctionName: string
    Enabled?: boolean
    BatchSize?: number
    StartingPosition?: 'TRIM_HORIZON' | 'LATEST' | 'AT_TIMESTAMP'
    StartingPositionTimestamp?: Date
    MaximumBatchingWindowInSeconds?: number
    ParallelizationFactor?: number
    MaximumRecordAgeInSeconds?: number
    BisectBatchOnFunctionError?: boolean
    DestinationConfig?: { OnFailure: { Destination: string } }
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateEventSourceMappingCommand(options)
      const response: CreateEventSourceMappingCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to create event source mapping', 500, 'lambda')
    }
  }
}

export const lambdaService = new LambdaService()

export const listFunctions = (options?: Parameters<LambdaService['listFunctions']>[0]) =>
  lambdaService.listFunctions(options)
export const createFunction = (request: Parameters<LambdaService['createFunction']>[0]) =>
  lambdaService.createFunction(request)
export const getFunction = (functionName: string) =>
  lambdaService.getFunction(functionName)
export const getFunctionConfiguration = (functionName: string) =>
  lambdaService.getFunctionConfiguration(functionName)
export const deleteFunction = (functionName: string) =>
  lambdaService.deleteFunction(functionName)
export const updateFunctionCode = (
  functionName: string,
  options: Parameters<LambdaService['updateFunctionCode']>[1]
) => lambdaService.updateFunctionCode(functionName, options)
export const updateFunctionConfiguration = (
  functionName: string,
  options: Parameters<LambdaService['updateFunctionConfiguration']>[1]
) => lambdaService.updateFunctionConfiguration(functionName, options)
export const invoke = (
  functionName: string,
  payload?: unknown,
  options?: Parameters<LambdaService['invoke']>[2]
) => lambdaService.invoke(functionName, payload, options)
export const getEventSourceMapping = (uuid: string) =>
  lambdaService.getEventSourceMapping(uuid)
export const listEventSourceMappings = (
  options?: Parameters<LambdaService['listEventSourceMappings']>[0]
) => lambdaService.listEventSourceMappings(options)
export const createEventSourceMapping = (
  options: Parameters<LambdaService['createEventSourceMapping']>[0]
) => lambdaService.createEventSourceMapping(options)

export default lambdaService
