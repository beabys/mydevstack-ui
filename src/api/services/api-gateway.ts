/**
 * API Gateway Service API Client
 * AWS SDK v3 implementation for Amazon API Gateway
 * @module api/services/api-gateway
 */

import {
  APIGatewayClient,
  GetRestApisCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  GetRestApiCommand,
  UpdateRestApiCommand,
  GetResourcesCommand,
  GetResourceCommand,
  CreateResourceCommand,
  DeleteResourceCommand,
  PutMethodCommand,
  GetMethodCommand,
  DeleteMethodCommand,
  PutIntegrationCommand,
  GetIntegrationCommand,
  DeleteIntegrationCommand,
  CreateDeploymentCommand,
  DeleteDeploymentCommand,
  CreateStageCommand,
  GetStagesCommand,
  UpdateStageCommand,
  DeleteStageCommand,
  type GetRestApisCommandOutput,
  type CreateRestApiCommandOutput,
  type GetResourcesCommandOutput,
  type CreateResourceCommandOutput,
  type GetMethodCommandOutput,
  type PutMethodCommandOutput,
  type PutIntegrationCommandOutput,
  type CreateDeploymentCommandOutput,
  type CreateStageCommandOutput,
  type GetStagesCommandOutput,
} from '@aws-sdk/client-api-gateway'
import {
  ApiGatewayV2Client,
  GetApisCommand,
  CreateApiCommand,
  DeleteApiCommand,
  GetApiCommand,
  GetRoutesCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  GetIntegrationsCommand,
  CreateIntegrationCommand,
  DeleteIntegrationCommand as DeleteIntegrationV2Command,
  type GetApisCommandOutput,
  type CreateApiCommandOutput,
  type GetRoutesCommandOutput,
  type CreateRouteCommandOutput,
  type GetIntegrationsCommandOutput,
  type CreateIntegrationCommandOutput,
} from '@aws-sdk/client-apigatewayv2'
import yaml from 'js-yaml'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let apiGatewayClient: APIGatewayClient | null = null
let apiGatewayV2Client: ApiGatewayV2Client | null = null

function getAPIGatewayClient(): APIGatewayClient {
  const settingsStore = useSettingsStore()
  
  if (!apiGatewayClient) {
    apiGatewayClient = new APIGatewayClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return apiGatewayClient
}

function getAPIGatewayV2Client(): ApiGatewayV2Client {
  const settingsStore = useSettingsStore()
  
  if (!apiGatewayV2Client) {
    apiGatewayV2Client = new ApiGatewayV2Client({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return apiGatewayV2Client
}

export function refreshAPIGatewayClient(): void {
  apiGatewayClient = null
  getAPIGatewayClient()
}

export class APIGatewayService {
  private getClient(): APIGatewayClient {
    return getAPIGatewayClient()
  }

  async getRestApis(options?: { position?: string; limit?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetRestApisCommand(options as any)
      const response: GetRestApisCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get REST APIs', 500, 'apigateway')
    }
  }

  async createRestApi(name: string, options?: {
    Description?: string
    Version?: string
    BinaryMediaTypes?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateRestApiCommand({
        name,
        ...options,
      } as any)
      const response: CreateRestApiCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('CreateRestApi error:', error)
      throw new APIError(`Failed to create REST API: ${name}`, 500, 'apigateway')
    }
  }

  async deleteRestApi(apiId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteRestApiCommand({ restApiId: apiId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete REST API: ${apiId}`, 500, 'apigateway')
    }
  }

  async getRestApi(apiId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetRestApiCommand({ restApiId: apiId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get REST API: ${apiId}`, 500, 'apigateway')
    }
  }

  async updateRestApi(apiId: string, options?: {
    name?: string
    description?: string
    version?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateRestApiCommand({
        restApiId: apiId,
        ...options,
      } as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update REST API: ${apiId}`, 500, 'apigateway')
    }
  }

  async getResources(apiId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetResourcesCommand({ restApiId: apiId })
      const response: GetResourcesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get resources: ${apiId}`, 500, 'apigateway')
    }
  }

  async getResource(apiId: string, resourceId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetResourceCommand({ restApiId: apiId, resourceId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get resource: ${resourceId}`, 500, 'apigateway')
    }
  }

  async createResource(apiId: string, parentId: string, pathPart: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateResourceCommand({
        restApiId: apiId,
        parentId,
        pathPart,
      })
      const response: CreateResourceCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create resource`, 500, 'apigateway')
    }
  }

  async deleteResource(apiId: string, resourceId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteResourceCommand({ restApiId: apiId, resourceId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete resource: ${resourceId}`, 500, 'apigateway')
    }
  }

  async putMethod(apiId: string, resourceId: string, httpMethod: string, options?: {
    authorizationType?: string
    apiKeyRequired?: boolean
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutMethodCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
        ...options,
      } as any)
      const response: PutMethodCommandOutput = await client.send(command)
      return response
    } catch (error) {
      console.error('PutMethod error:', error)
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put method: ${error}`, 500, 'apigateway')
    }
  }

  async getMethod(apiId: string, resourceId: string, httpMethod: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetMethodCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
      })
      const response: GetMethodCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get method`, 500, 'apigateway')
    }
  }

  async deleteMethod(apiId: string, resourceId: string, httpMethod: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteMethodCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete method`, 500, 'apigateway')
    }
  }

  async putIntegration(apiId: string, resourceId: string, httpMethod: string, options?: {
    type?: string
    uri?: string
    integrationHttpMethod?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutIntegrationCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
        ...options,
      } as any)
      const response: PutIntegrationCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put integration`, 500, 'apigateway')
    }
  }

  async getIntegration(apiId: string, resourceId: string, httpMethod: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetIntegrationCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get integration`, 500, 'apigateway')
    }
  }

  async deleteIntegration(apiId: string, resourceId: string, httpMethod: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteIntegrationCommand({
        restApiId: apiId,
        resourceId,
        httpMethod: httpMethod.toUpperCase(),
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete integration`, 500, 'apigateway')
    }
  }

  async createDeployment(apiId: string, options?: {
    stageName?: string
    stageDescription?: string
    description?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateDeploymentCommand({
        restApiId: apiId,
        ...options,
      } as any)
      const response: CreateDeploymentCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create deployment`, 500, 'apigateway')
    }
  }

  async deleteDeployment(apiId: string, deploymentId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteDeploymentCommand({
        restApiId: apiId,
        deploymentId,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete deployment`, 500, 'apigateway')
    }
  }

  async createStage(apiId: string, deploymentId: string, stageName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateStageCommand({
        restApiId: apiId,
        deploymentId,
        stageName,
      })
      const response: CreateStageCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create stage`, 500, 'apigateway')
    }
  }

  async getStages(apiId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetStagesCommand({ restApiId: apiId })
      const response: GetStagesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get stages`, 500, 'apigateway')
    }
  }

  async updateStage(apiId: string, stageName: string, options?: any): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateStageCommand({
        restApiId: apiId,
        stageName,
        ...options,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update stage: ${stageName}`, 500, 'apigateway')
    }
  }

  async deleteStage(apiId: string, stageName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteStageCommand({
        restApiId: apiId,
        stageName,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete stage: ${stageName}`, 500, 'apigateway')
    }
  }
}

export const apiGatewayService = new APIGatewayService()

export const getRestApis = (options?: any) => apiGatewayService.getRestApis(options)
export const createRestApi = (name: string, options?: any) => apiGatewayService.createRestApi(name, options)
export const deleteRestApi = (apiId: string) => apiGatewayService.deleteRestApi(apiId)
export const getRestApi = (apiId: string) => apiGatewayService.getRestApi(apiId)
export const updateRestApi = (apiId: string, options?: any) => apiGatewayService.updateRestApi(apiId, options)
export const getResources = (apiId: string) => apiGatewayService.getResources(apiId)
export const getResource = (apiId: string, resourceId: string) => apiGatewayService.getResource(apiId, resourceId)
export const createResource = (apiId: string, parentId: string, pathPart: string) => 
  apiGatewayService.createResource(apiId, parentId, pathPart)
export const deleteResource = (apiId: string, resourceId: string) => 
  apiGatewayService.deleteResource(apiId, resourceId)
export const putMethod = (apiId: string, resourceId: string, httpMethod: string, options?: any) => 
  apiGatewayService.putMethod(apiId, resourceId, httpMethod, options)
export const getMethod = (apiId: string, resourceId: string, httpMethod: string) => 
  apiGatewayService.getMethod(apiId, resourceId, httpMethod)
export const deleteMethod = (apiId: string, resourceId: string, httpMethod: string) => 
  apiGatewayService.deleteMethod(apiId, resourceId, httpMethod)
export const putIntegration = (apiId: string, resourceId: string, httpMethod: string, options?: any) => 
  apiGatewayService.putIntegration(apiId, resourceId, httpMethod, options)
export const getIntegration = (apiId: string, resourceId: string, httpMethod: string) => 
  apiGatewayService.getIntegration(apiId, resourceId, httpMethod)
export const deleteIntegration = (apiId: string, resourceId: string, httpMethod: string) => 
  apiGatewayService.deleteIntegration(apiId, resourceId, httpMethod)
export const createDeployment = (apiId: string, options?: any) => 
  apiGatewayService.createDeployment(apiId, options)
export const deleteDeployment = (apiId: string, deploymentId: string) => 
  apiGatewayService.deleteDeployment(apiId, deploymentId)
export const createStage = (apiId: string, deploymentId: string, stageName: string) => 
  apiGatewayService.createStage(apiId, deploymentId, stageName)
export const getStages = (apiId: string) => apiGatewayService.getStages(apiId)
export const updateStage = (apiId: string, stageName: string, options?: any) => 
  apiGatewayService.updateStage(apiId, stageName, options)
export const deleteStage = (apiId: string, stageName: string) => 
  apiGatewayService.deleteStage(apiId, stageName)

// HTTP API v2 methods (API Gateway HTTP APIs)
// Note: LocalStack may not fully support HTTP APIs (v2), so we handle NotImplemented errors
export const getHttpApis = async (options?: any): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new GetApisCommand(options || {})
    const response: GetApisCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    // LocalStack returns 501 for unimplemented HTTP APIs
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      console.warn('HTTP APIs not supported by LocalStack, returning empty list')
      return { items: [] }
    }
    if (error instanceof APIError) throw error
    throw new APIError('Failed to get HTTP APIs', 500, 'apigateway')
  }
}

export const createHttpApi = async (name: string, options?: any): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new CreateApiCommand({
      name,
      ...options,
    })
    const response: CreateApiCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to create HTTP API: ${name}`, 500, 'apigateway')
  }
}

export const deleteHttpApi = async (apiId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new DeleteApiCommand({ ApiId: apiId })
    return await client.send(command)
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to delete HTTP API: ${apiId}`, 500, 'apigateway')
  }
}

export const getHttpApi = async (apiId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new GetApiCommand({ ApiId: apiId })
    return await client.send(command)
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      return { items: [] }
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to get HTTP API: ${apiId}`, 500, 'apigateway')
  }
}

export const getRoutes = async (apiId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new GetRoutesCommand({ ApiId: apiId })
    const response: GetRoutesCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      return { items: [] }
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to get routes for API: ${apiId}`, 500, 'apigateway')
  }
}

export const createRoute = async (apiId: string, options?: any): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new CreateRouteCommand({
      ApiId: apiId,
      ...options,
    })
    const response: CreateRouteCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to create route for API: ${apiId}`, 500, 'apigateway')
  }
}

export const deleteRoute = async (apiId: string, routeId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new DeleteRouteCommand({ ApiId: apiId, RouteId: routeId })
    return await client.send(command)
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to delete route: ${routeId}`, 500, 'apigateway')
  }
}

export const getIntegrations = async (apiId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new GetIntegrationsCommand({ ApiId: apiId })
    const response: GetIntegrationsCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      return { items: [] }
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to get integrations for API: ${apiId}`, 500, 'apigateway')
  }
}

export const createIntegration = async (apiId: string, options?: any): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new CreateIntegrationCommand({
      ApiId: apiId,
      ...options,
    })
    const response: CreateIntegrationCommandOutput = await client.send(command)
    return response
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to create integration for API: ${apiId}`, 500, 'apigateway')
  }
}

export const deleteHttpApiIntegration = async (apiId: string, integrationId: string): Promise<any> => {
  try {
    const client = getAPIGatewayV2Client()
    const command = new DeleteIntegrationV2Command({ ApiId: apiId, IntegrationId: integrationId })
    return await client.send(command)
  } catch (error: any) {
    if (error.statusCode === 501 || error.name === 'NotImplemented') {
      throw new APIError('HTTP APIs are not supported by LocalStack', 501, 'apigateway')
    }
    if (error instanceof APIError) throw error
    throw new APIError(`Failed to delete integration: ${integrationId}`, 500, 'apigateway')
  }
}

// Helper functions for Swagger/OpenAPI import
export function parseSwaggerSpec(content: string): any {
  try {
    // Try parsing as JSON first
    try {
      return JSON.parse(content)
    } catch {
      // Use js-yaml for YAML parsing
      return yaml.load(content)
    }
  } catch (error) {
    throw new Error(`Failed to parse Swagger spec: ${error}`)
  }
}

export function validateSwaggerSpec(spec: any): string[] {
  const errors: string[] = []
  
  if (!spec) {
    errors.push('Specification is empty')
    return errors
  }
  
  // Check for required fields
  const swaggerVersion = spec.swagger || spec.openapi
  if (!swaggerVersion) {
    errors.push('Missing swagger or openapi version')
  }
  
  if (!spec.info) {
    errors.push('Missing info section')
  } else {
    if (!spec.info.title) {
      errors.push('Missing info.title')
    }
    if (!spec.info.version) {
      errors.push('Missing info.version')
    }
  }
  
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined')
  }
  
  return errors
}

export async function importSwaggerFromFile(content: string): Promise<{
  apiId: string
  apiName: string
  resourcesCreated: number
  methodsCreated: number
  errors: string[]
}> {
  const result = {
    apiId: '',
    apiName: '',
    resourcesCreated: 0,
    methodsCreated: 0,
    errors: [] as string[],
  }
  
  try {
    // Parse the spec
    const spec = parseSwaggerSpec(content)
    const validationErrors = validateSwaggerSpec(spec)
    
    if (validationErrors.length > 0) {
      result.errors = validationErrors
      return result
    }
    
    // Create the REST API
    const apiName = spec.info?.title || 'Imported API'
    const createResponse = await createRestApi(apiName, {
      Description: spec.info?.description || `Imported from Swagger/OpenAPI spec version ${spec.info?.version}`,
    })
    
    result.apiId = createResponse.id || createResponse.name
    result.apiName = apiName
    
    // Import resources and methods
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        // Create the resource path
        const pathParts = path.split('/').filter(Boolean)
        let parentId = (await getResources(result.apiId)).items[0]?.id
        
        if (!parentId) {
          result.errors.push(`Could not find root resource for API ${result.apiId}`)
          continue
        }
        
        for (const part of pathParts) {
          try {
            // Try to find existing resource first
            const resources = await getResources(result.apiId)
            const existingResource = resources.items?.find((r: any) => r.path === `/${part}`)
            
            if (existingResource) {
              parentId = existingResource.id
            } else {
              const newResource = await createResource(result.apiId, parentId, part)
              parentId = newResource.id
              result.resourcesCreated++
            }
          } catch (error) {
            result.errors.push(`Failed to create resource ${part}: ${error}`)
          }
        }
        
        // Add methods to the resource
        const methods = pathItem as Record<string, any>
        for (const [method, _] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
            try {
              console.log(`Creating method: ${method.toUpperCase()} on path ${path}, resourceId: ${parentId}`)
              await putMethod(result.apiId, parentId, method.toUpperCase(), {
                authorizationType: 'NONE',
                apiKeyRequired: false,
              })
              result.methodsCreated++
            } catch (error) {
              console.error('Error creating method:', error)
              result.errors.push(`Failed to create ${method.toUpperCase()} method for ${path}: ${error}`)
            }
          }
        }
      }
    }
  } catch (error) {
    result.errors.push(`Import failed: ${error}`)
  }
  
  return result
}

export default apiGatewayService
