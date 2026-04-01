/**
 * Lambda Service API Client
 * Provides operations for AWS Lambda function management
 * @module api/services/lambda
 */

import { api, APIError } from '../client'
import type {
  LambdaFunction,
  LambdaListFunctionsResponse,
  LambdaCreateFunctionRequest,
  LambdaInvocation,
  LambdaEventSourceMapping,
} from '../types/aws'

/**
 * Lambda Service client for interacting with AWS Lambda
 */
export class LambdaService {
  private basePath: string
  private customEndpoint?: string

  constructor(customEndpoint?: string) {
    this.customEndpoint = customEndpoint
    this.basePath = '/2015-03-31/functions'
  }

  /**
   * Get the base URL for Lambda requests
   */
  private getBaseUrl(): string {
    return `${this.customEndpoint || ''}${this.basePath}`
  }

  /**
   * List all Lambda functions
   * @param options - Optional listing parameters
   * @returns Promise resolving to list of functions
   * @throws {APIError} If the request fails
   */
  async listFunctions(options?: {
    Marker?: string
    MaxItems?: number
    MasterRegion?: string
  }): Promise<{
    functions: LambdaFunction[]
    nextMarker?: string
  }> {
    try {
      const params = new URLSearchParams()
      if (options?.Marker) params.append('Marker', options.Marker)
      if (options?.MaxItems) params.append('MaxItems', options.MaxItems.toString())
      if (options?.MasterRegion) params.append('MasterRegion', options.MasterRegion)

      const queryString = params.toString()
      const url = `${this.getBaseUrl()}${queryString ? `?${queryString}` : ''}`

      const response = await api.get<LambdaListFunctionsResponse>(url)
      return {
        functions: response.data.Functions || [],
        nextMarker: response.data.NextMarker,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list functions', 500, 'lambda')
    }
  }

  /**
   * Create a new Lambda function
   * @param request - Function creation parameters
   * @returns Promise resolving to created function
   * @throws {APIError} If the request fails
   */
  async createFunction(request: LambdaCreateFunctionRequest): Promise<LambdaFunction> {
    try {
      const response = await api.post<LambdaFunction>(this.getBaseUrl(), request)
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create function: ${request.FunctionName}`, 500, 'lambda')
    }
  }

  /**
   * Get a Lambda function by name
   * @param functionName - Function name or ARN
   * @returns Promise resolving to function details
   * @throws {APIError} If the request fails
   */
  async getFunction(functionName: string): Promise<{
    Configuration: LambdaFunction
    Code?: {
      Location: string
      RepositoryType: string
    }
    Tags?: Record<string, string>
  }> {
    try {
      const response = await api.get<{
        Configuration: LambdaFunction
        Code?: {
          Location: string
          RepositoryType: string
        }
        Tags?: Record<string, string>
      }>(`${this.getBaseUrl()}/${encodeURIComponent(functionName)}`)
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get function: ${functionName}`, 500, 'lambda')
    }
  }

  /**
   * Get function configuration (without code location)
   * @param functionName - Function name or ARN
   * @returns Promise resolving to function configuration
   * @throws {APIError} If the request fails
   */
  async getFunctionConfiguration(functionName: string): Promise<LambdaFunction> {
    try {
      const response = await api.get<LambdaFunction>(
        `${this.getBaseUrl()}/${encodeURIComponent(functionName)}/configuration`
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get function configuration: ${functionName}`, 500, 'lambda')
    }
  }

  /**
   * Delete a Lambda function
   * @param functionName - Function name or ARN
   * @returns Promise resolving when function is deleted
   * @throws {APIError} If the request fails
   */
  async deleteFunction(functionName: string): Promise<void> {
    try {
      await api.delete(`${this.getBaseUrl()}/${encodeURIComponent(functionName)}`)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete function: ${functionName}`, 500, 'lambda')
    }
  }

  /**
   * Update function code
   * @param functionName - Function name or ARN
   * @param options - Code update options
   * @returns Promise resolving to updated function configuration
   * @throws {APIError} If the request fails
   */
  async updateFunctionCode(
    functionName: string,
    options: {
      ZipFile?: string
      S3Bucket?: string
      S3Key?: string
      S3ObjectVersion?: string
      DryRun?: boolean
      Publish?: boolean
    }
  ): Promise<LambdaFunction> {
    try {
      const response = await api.put<LambdaFunction>(
        `${this.getBaseUrl()}/${encodeURIComponent(functionName)}/code`,
        options
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update function code: ${functionName}`, 500, 'lambda')
    }
  }

  /**
   * Invoke a Lambda function
   * @param functionName - Function name or ARN
   * @param payload - Invocation payload
   * @param options - Invocation options
   * @returns Promise resolving to invocation result
   * @throws {APIError} If the request fails
   */
  async invoke(
    functionName: string,
    payload?: unknown,
    options?: {
      invocationType?: 'RequestResponse' | 'Event' | 'DryRun'
      logType?: 'None' | 'Tail'
      clientContext?: string
    }
  ): Promise<LambdaInvocation> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (options?.invocationType) {
        headers['X-Amz-Invocation-Type'] = options.invocationType
      }
      if (options?.logType) {
        headers['X-Amz-Log-Type'] = options.logType
      }
      if (options?.clientContext) {
        headers['X-Amz-Client-Context'] = options.clientContext
      }

      const response = await api.post(
        `${this.getBaseUrl()}/${encodeURIComponent(functionName)}/invocations`,
        payload || {},
        {
          headers,
          responseType: options?.invocationType === 'Event' ? 'text' : 'json',
        }
      )

      return {
        Payload: typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data),
        StatusCode: response.status,
        LogResult: response.headers['x-amz-log-result'] as string,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to invoke function: ${functionName}`, 500, 'lambda')
    }
  }

  /**
   * Get an event source mapping
   * @param uuid - Event source mapping UUID
   * @returns Promise resolving to event source mapping
   * @throws {APIError} If the request fails
   */
  async getEventSourceMapping(uuid: string): Promise<LambdaEventSourceMapping> {
    try {
      const response = await api.get<LambdaEventSourceMapping>(
        `${this.customEndpoint || ''}/2015-03-31/event-source-mappings/${uuid}`
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get event source mapping: ${uuid}`, 500, 'lambda')
    }
  }

  /**
   * List event source mappings
   * @param options - Optional listing parameters
   * @returns Promise resolving to list of event source mappings
   * @throws {APIError} If the request fails
   */
  async listEventSourceMappings(options?: {
    EventSourceArn?: string
    FunctionName?: string
    Marker?: string
    MaxItems?: number
  }): Promise<{
    EventSourceMappings: LambdaEventSourceMapping[]
    NextMarker?: string
  }> {
    try {
      const params = new URLSearchParams()
      if (options?.EventSourceArn) params.append('EventSourceArn', options.EventSourceArn)
      if (options?.FunctionName) params.append('FunctionName', options.FunctionName)
      if (options?.Marker) params.append('Marker', options.Marker)
      if (options?.MaxItems) params.append('MaxItems', options.MaxItems.toString())

      const queryString = params.toString()
      const url = `${this.customEndpoint || ''}/2015-03-31/event-source-mappings${queryString ? `?${queryString}` : ''}`

      const response = await api.get<{
        EventSourceMappings: LambdaEventSourceMapping[]
        NextMarker?: string
      }>(url)
      return {
        EventSourceMappings: response.data.EventSourceMappings || [],
        NextMarker: response.data.NextMarker,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list event source mappings', 500, 'lambda')
    }
  }

  /**
   * Create an event source mapping
   * @param options - Event source mapping configuration
   * @returns Promise resolving to created event source mapping
   * @throws {APIError} If the request fails
   */
  async createEventSourceMapping(options: {
    EventSourceArn: string
    FunctionName: string
    Enabled?: boolean
    BatchSize?: number
    StartingPosition?: 'TRIM_HORIZON' | 'LATEST' | 'AT_TIMESTAMP'
    StartingPositionTimestamp?: string
    MaximumBatchingWindowInSeconds?: number
    ParallelizationFactor?: number
    MaximumRecordAgeInSeconds?: number
    BisectBatchOnFunctionError?: boolean
    DestinationConfig?: {
      OnFailure: {
        Destination: string
      }
    }
  }): Promise<LambdaEventSourceMapping> {
    try {
      const response = await api.post<LambdaEventSourceMapping>(
        `${this.customEndpoint || ''}/2015-03-31/event-source-mappings`,
        options
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to create event source mapping', 500, 'lambda')
    }
  }
}

// Default export for singleton instance
export const lambdaService = new LambdaService()

// Named exports for convenience
export const listFunctions = (options?: Parameters<LambdaService['listFunctions']>[0]) =>
  lambdaService.listFunctions(options)
export const createFunction = (request: LambdaCreateFunctionRequest) =>
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
