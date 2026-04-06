/**
 * API Gateway Service API Client
 * Simple HTTP client for API Gateway via Go proxy
 * @module api/services/api-gateway
 */

import yaml from 'js-yaml'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

async function apiGatewayRequest(action: string, body: object = {}): Promise<any> {
  const settingsStore = useSettingsStore()
  const endpoint = settingsStore.endpoint.replace(/\/$/, '')

  const url = `${endpoint}/apigateway/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `apigateway.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`API Gateway ${action} failed: ${errorText}`, response.status, 'apigateway')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`API Gateway ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'apigateway')
  }
}

export class APIGatewayService {
  // REST API operations
  async getRestApis(options?: { position?: string; limit?: number }): Promise<any> {
    const response = await apiGatewayRequest('GetRestApis', options || {})
    // Normalize case: AWS SDK returns Items, Id (capitalized), but we want items, id (lowercase) for consistency
    if (response.Items && !response.items) {
      response.items = response.Items.map((item: any) => ({
        ...item,
        id: item.Id || item.id,
        name: item.Name || item.name,
        description: item.Description || item.description,
      }))
    }
    return response
  }

  async createRestApi(name: string, options?: {
    Description?: string
    Version?: string
    BinaryMediaTypes?: string[]
  }): Promise<any> {
    return apiGatewayRequest('CreateRestApi', { name, ...options })
  }

  async deleteRestApi(restApiId: string): Promise<any> {
    return apiGatewayRequest('DeleteRestApi', { restApiId })
  }

  async getRestApi(restApiId: string): Promise<any> {
    const result = await apiGatewayRequest('GetRestApi', { restApiId })
    // Normalize case: AWS SDK returns Name, Id (capitalized), but we want name, id (lowercase)
    if (result) {
      result.id = result.id || result.Id
      result.name = result.name || result.Name
      result.description = result.description || result.Description
    }
    return result
  }

  async updateRestApi(restApiId: string, options: {
    name?: string
    description?: string
  }): Promise<any> {
    return apiGatewayRequest('UpdateRestApi', { restApiId, ...options })
  }

  async getResources(restApiId: string): Promise<any> {
    const response = await apiGatewayRequest('GetResources', { restApiId })
    // Normalize case: AWS SDK returns Id, ParentId, Path, PathPart, ResourceMethods (capitalized)
    if (response.Items) {
      response.items = response.Items.map((item: any) => ({
        ...item,
        id: item.Id || item.id,
        parentId: item.ParentId || item.parentId,
        path: item.Path || item.path,
        pathPart: item.PathPart || item.pathPart,
        resourceMethods: item.ResourceMethods || item.resourceMethods,
      }))
    }
    // Also ensure items is at top level for easier access
    if (!response.items && response.Items) {
      response.items = response.Items
    }
    return response
  }

  async getResource(restApiId: string, resourceId: string): Promise<any> {
    return apiGatewayRequest('GetResource', { restApiId, resourceId })
  }

  async createResource(restApiId: string, parentId: string, pathPart: string): Promise<any> {
    return apiGatewayRequest('CreateResource', { restApiId, parentId, pathPart })
  }

  async deleteResource(restApiId: string, resourceId: string): Promise<any> {
    return apiGatewayRequest('DeleteResource', { restApiId, resourceId })
  }

  async putMethod(restApiId: string, resourceId: string, httpMethod: string, options?: {
    authorizationType?: string
    apiKeyRequired?: boolean
  }): Promise<any> {
    return apiGatewayRequest('PutMethod', {
      restApiId,
      resourceId,
      httpMethod: httpMethod.toUpperCase(),
      ...options,
    })
  }

  async getMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('GetMethod', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async deleteMethod(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('DeleteMethod', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  // Create method (wrapper around PutMethod)
  async createMethod(restApiId: string, resourceId: string, httpMethod: string, options?: {
    authorizationType?: string
    apiKeyRequired?: boolean
  }): Promise<any> {
    return this.putMethod(restApiId, resourceId, httpMethod, options)
  }

  async putIntegration(restApiId: string, resourceId: string, httpMethod: string, options?: {
    type?: string
    uri?: string
    integrationHttpMethod?: string
  }): Promise<any> {
    return apiGatewayRequest('PutIntegration', {
      restApiId,
      resourceId,
      httpMethod: httpMethod.toUpperCase(),
      ...options,
    })
  }

  async getIntegration(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('GetIntegration', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async deleteIntegration(restApiId: string, resourceId: string, httpMethod: string): Promise<any> {
    return apiGatewayRequest('DeleteIntegration', { restApiId, resourceId, httpMethod: httpMethod.toUpperCase() })
  }

  async createDeployment(restApiId: string, options?: {
    stageName?: string
    stageDescription?: string
    description?: string
  }): Promise<any> {
    return apiGatewayRequest('CreateDeployment', { restApiId, ...options })
  }

  async deleteDeployment(restApiId: string, deploymentId: string): Promise<any> {
    return apiGatewayRequest('DeleteDeployment', { restApiId, deploymentId })
  }

  async createStage(restApiId: string, deploymentId: string, stageName: string): Promise<any> {
    return apiGatewayRequest('CreateStage', { restApiId, deploymentId, stageName })
  }

  async getStages(restApiId: string): Promise<any> {
    return apiGatewayRequest('GetStages', { restApiId })
  }

  async updateStage(restApiId: string, stageName: string, patchOperations: Array<{
    op: string
    path: string
    value?: string
  }>): Promise<any> {
    return apiGatewayRequest('UpdateStage', { restApiId, stageName, patchOperations })
  }

  async deleteStage(restApiId: string, stageName: string): Promise<any> {
    return apiGatewayRequest('DeleteStage', { restApiId, stageName })
  }

  // HTTP API v2 operations
  async getApis(options?: any): Promise<any> {
    return apiGatewayRequest('GetApis', options || {})
  }

  async createApi(name: string, options?: {
    Description?: string
    ProtocolType?: string
  }): Promise<any> {
    return apiGatewayRequest('CreateApi', { name, ...options })
  }

  async deleteApi(apiId: string): Promise<any> {
    return apiGatewayRequest('DeleteApi', { apiId })
  }

  async getApi(apiId: string): Promise<any> {
    return apiGatewayRequest('GetApi', { apiId })
  }

  async getRoutes(apiId: string): Promise<any> {
    return apiGatewayRequest('GetRoutes', { apiId })
  }

  async createRoute(apiId: string, options?: any): Promise<any> {
    return apiGatewayRequest('CreateRoute', { apiId, ...options })
  }

  async deleteRoute(apiId: string, routeId: string): Promise<any> {
    return apiGatewayRequest('DeleteRoute', { apiId, routeId })
  }

  async getIntegrations(apiId: string): Promise<any> {
    return apiGatewayRequest('GetIntegrations', { apiId })
  }

  async createIntegration(apiId: string, options?: any): Promise<any> {
    return apiGatewayRequest('CreateIntegration', { apiId, ...options })
  }

  async deleteHttpApiIntegration(apiId: string, integrationId: string): Promise<any> {
    return apiGatewayRequest('DeleteIntegration', { apiId, integrationId })
  }
}

export const apiGatewayService = new APIGatewayService()

// Re-export for backward compatibility
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

// HTTP API v2 methods
export const getHttpApis = (options?: any) => apiGatewayService.getApis(options)
export const createHttpApi = (name: string, options?: any) => apiGatewayService.createApi(name, options)
export const deleteHttpApi = (apiId: string) => apiGatewayService.deleteApi(apiId)
export const getHttpApi = (apiId: string) => apiGatewayService.getApi(apiId)
export const getHttpRoutes = (apiId: string) => apiGatewayService.getRoutes(apiId)
export const createHttpRoute = (apiId: string, options: any) => apiGatewayService.createRoute(apiId, options)
export const deleteHttpRoute = (apiId: string, routeId: string) => apiGatewayService.deleteRoute(apiId, routeId)
export const getHttpIntegrations = (apiId: string) => apiGatewayService.getIntegrations(apiId)
export const createHttpIntegration = (apiId: string, options: any) => apiGatewayService.createIntegration(apiId, options)
export const deleteHttpApiIntegration = (apiId: string, integrationId: string) =>
  apiGatewayService.deleteHttpApiIntegration(apiId, integrationId)

// Aliases for convenience (matching component expectations)
export const getRoutes = (apiId: string) => apiGatewayService.getRoutes(apiId)
export const createRoute = (apiId: string, options: any) => apiGatewayService.createRoute(apiId, options)
export const deleteRoute = (apiId: string, routeId: string) => apiGatewayService.deleteRoute(apiId, routeId)
export const getIntegrations = (apiId: string) => apiGatewayService.getIntegrations(apiId)
export const createIntegration = (apiId: string, options: any) => apiGatewayService.createIntegration(apiId, options)
export const deleteHttpApiIntegration2 = (apiId: string, integrationId: string) =>
  apiGatewayService.deleteHttpApiIntegration(apiId, integrationId)
export const createMethod = (restApiId: string, resourceId: string, httpMethod: string, options?: any) =>
  apiGatewayService.createMethod(restApiId, resourceId, httpMethod, options)

// Swagger/OpenAPI import functions
export function parseSwaggerSpec(content: string): any {
  try {
    // Try JSON first
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
    
    // Use ImportRestApi to import the Swagger spec
    const apiName = spec.info?.title || 'Imported API'
    
    // Send the raw Swagger content directly (not base64 encoded)
    // The Go proxy will handle it appropriately
    const importResponse = await apiGatewayRequest('ImportRestApi', {
      body: content,
    })
    
    result.apiId = importResponse.id || importResponse.name
    result.apiName = apiName
    
    // Note: ImportRestApi handles resources and methods automatically
    // So we just report success
    result.resourcesCreated = 0 // Import handles this
    result.methodsCreated = 0 // Import handles this
    
  } catch (error: any) {
    result.errors.push(`Import failed: ${error.message || error}`)
  }
  
  return result
}

export function refreshAPIGatewayClient(): void {
  // No-op: HTTP-based implementation reads endpoint directly from settings
}

export default apiGatewayService