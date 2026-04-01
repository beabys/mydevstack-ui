/**
 * API Gateway Service API
 * Handles all Amazon API Gateway operations via the API client
 * Supports both REST API v1 and HTTP API v2
 */

import { api } from '../client'
import type { APIGatewayRestAPI } from '../types/aws'

// OpenAPI/Swagger types
export interface OpenAPISpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  paths: Record<string, OpenAPIPathItem>
  servers?: Array<{ url: string; description?: string }>
  host?: string
  basePath?: string
  schemes?: string[]
}

export interface OpenAPIPathItem {
  summary?: string
  description?: string
  get?: OpenAPIOperation
  post?: OpenAPIOperation
  put?: OpenAPIOperation
  delete?: OpenAPIOperation
  patch?: OpenAPIOperation
  options?: OpenAPIOperation
  head?: OpenAPIOperation
}

export interface OpenAPIOperation {
  summary?: string
  description?: string
  operationId?: string
  responses: Record<string, OpenAPIResponse>
  parameters?: OpenAPIParameter[]
  tags?: string[]
}

export interface OpenAPIResponse {
  description: string
  content?: Record<string, unknown>
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  required?: boolean
  schema?: unknown
  description?: string
}

export interface SwaggerImportResult {
  apiId: string
  apiName: string
  resourcesCreated: number
  methodsCreated: number
  errors: string[]
}

/**
 * Parse a Swagger/OpenAPI JSON or YAML string
 */
export function parseSwaggerSpec(content: string): OpenAPISpec {
  // Try parsing as JSON first
  try {
    return JSON.parse(content) as OpenAPISpec
  } catch {
    // If JSON fails, try parsing as YAML (simple YAML parser)
    // For more complex YAML, you'd want to use a YAML library
    const lines = content.split('\n')
    const result: Record<string, unknown> = {}
    let currentKey = ''
    let currentObject: Record<string, unknown> | null = null
    const indentLevel = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const match = trimmed.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        if (value && !value.startsWith('{') && !value.startsWith('[')) {
          result[key] = value.replace(/['"]/g, '')
        } else {
          currentKey = key
          currentObject = {}
          result[key] = currentObject
        }
      }
    }
    
    // Fallback - if YAML parsing is too complex, throw error
    throw new Error('Failed to parse Swagger/OpenAPI specification')
  }
}

/**
 * Validate a Swagger/OpenAPI spec
 */
export function validateSwaggerSpec(spec: OpenAPISpec): string[] {
  const errors: string[] = []
  
  if (!spec.openapi && !spec.swagger) {
    errors.push('Missing "openapi" or "swagger" version field')
  }
  
  if (!spec.info?.title) {
    errors.push('Missing "info.title" field')
  }
  
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined in specification')
  }
  
  // Check for valid HTTP methods
  const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of Object.keys(pathItem)) {
      if (validMethods.includes(method) && !pathItem[method as keyof OpenAPIPathItem]) {
        continue
      }
      if (validMethods.includes(method) && pathItem[method as keyof OpenAPIPathItem]) {
        const operation = pathItem[method as keyof OpenAPIPathItem] as OpenAPIOperation
        if (!operation.responses || Object.keys(operation.responses).length === 0) {
          errors.push(`Path ${path} ${method.toUpperCase()}: Missing responses`)
        }
      }
    }
  }
  
  return errors
}

/**
 * Extract resources (paths) from a Swagger spec
 */
export function extractResourcesFromSpec(spec: OpenAPISpec): string[] {
  const resources: string[] = []
  const basePath = spec.basePath || ''
  
  for (const path of Object.keys(spec.paths)) {
    // Convert OpenAPI path params {param} to API Gateway format {param}
    const normalizedPath = path.replace(/\{([^}]+)\}/g, '{$1}')
    resources.push(normalizedPath)
  }
  
  return resources
}

/**
 * Import a Swagger/OpenAPI specification to create REST API resources and methods
 */
export async function importSwaggerSpec(
  spec: OpenAPISpec,
  apiId?: string
): Promise<SwaggerImportResult> {
  const result: SwaggerImportResult = {
    apiId: apiId || '',
    apiName: spec.info?.title || 'Imported API',
    resourcesCreated: 0,
    methodsCreated: 0,
    errors: [],
  }
  
  // Create API if not provided
  if (!apiId) {
    try {
      const apiResponse = await createRestApi({
        name: spec.info.title,
        description: spec.info.description,
      })
      apiId = apiResponse.id
      result.apiId = apiId
    } catch (error) {
      result.errors.push(`Failed to create API: ${error}`)
      return result
    }
  }
  
  // Get the root resource
  let rootResourceId: string | null = null
  try {
    const resourcesResponse = await getResources(apiId)
    const rootResource = resourcesResponse.items.find(r => r.path === '/')
    rootResourceId = rootResource?.id || null
  } catch (error) {
    result.errors.push(`Failed to get root resource: ${error}`)
    return result
  }
  
  if (!rootResourceId) {
    result.errors.push('Could not find root resource')
    return result
  }
  
  // Create a map of path segments to their resource IDs
  const resourceIdMap: Record<string, string> = {
    '/': rootResourceId,
  }
  
  // Process each path
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    try {
      // Create resource for this path
      const segments = path.split('/').filter(Boolean)
      let parentId = rootResourceId
      let currentPath = ''
      
      for (const segment of segments) {
        currentPath += '/' + segment
        const pathPart = segment.replace(/\{([^}]+)\}/g, '{$1}')
        
        // Check if resource already exists
        if (!resourceIdMap[currentPath]) {
          try {
            const resourceResponse = await createResource(apiId, parentId, pathPart)
            resourceIdMap[currentPath] = resourceResponse.id
            result.resourcesCreated++
            parentId = resourceResponse.id
          } catch (error) {
            // Resource might already exist, try to find it
            const existingResources = await getResources(apiId)
            const existing = existingResources.items.find(r => r.path === currentPath)
            if (existing) {
              resourceIdMap[currentPath] = existing.id
              parentId = existing.id
            } else {
              result.errors.push(`Failed to create resource ${currentPath}: ${error}`)
              break
            }
          }
        } else {
          parentId = resourceIdMap[currentPath]
        }
      }
      
      const resourceId = resourceIdMap[currentPath]
      if (!resourceId) continue
      
      // Create methods for this path
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const
      
      for (const method of methods) {
        const operation = pathItem[method]
        if (!operation) continue
        
        try {
          await createMethod(apiId, resourceId, method.toUpperCase(), 'NONE', {
            apiKeyRequired: false,
          })
          result.methodsCreated++
        } catch (error) {
          // Method might already exist
          result.errors.push(`Failed to create ${method.toUpperCase()} method for ${path}: ${error}`)
        }
      }
    } catch (error) {
      result.errors.push(`Failed to process path ${path}: ${error}`)
    }
  }
  
  return result
}

/**
 * Import a Swagger/OpenAPI file (file content as string)
 */
export async function importSwaggerFromFile(
  fileContent: string,
  existingApiId?: string
): Promise<SwaggerImportResult> {
  const spec = parseSwaggerSpec(fileContent)
  const errors = validateSwaggerSpec(spec)
  
  if (errors.length > 0) {
    return {
      apiId: '',
      apiName: spec.info?.title || 'Invalid Specification',
      resourcesCreated: 0,
      methodsCreated: 0,
      errors,
    }
  }
  
  return importSwaggerSpec(spec, existingApiId)
}

// Response types for REST API v1
interface CreateRestApiResponse {
  id: string
  name: string
  description?: string
  version?: string
  binaryMediaTypes?: string[]
  createdDate: string
}

interface GetRestApisResponse {
  items: Array<{
    id: string
    name: string
    description?: string
    createdDate: string
  }>
  position?: string
}

interface CreateResourceResponse {
  id: string
  parentId: string
  path: string
  pathPart?: string
  resourceMethods?: Record<string, unknown>
}

interface GetResourcesResponse {
  items: Array<{
    id: string
    parentId: string
    path: string
    pathPart?: string
    resourceMethods?: Record<string, unknown>
  }>
  position?: string
}

interface CreateMethodResponse {
  httpMethod: string
  authorizationType: string
  apiKeyRequired?: boolean
  methodResponses?: Record<string, unknown>
}

interface GetMethodResponse extends CreateMethodResponse {
  methodIntegration?: unknown
  requestValidatorId?: string
}

interface CreateDeploymentResponse {
  id: string
  createdDate: string
}

interface GetDeploymentsResponse {
  items: Array<{
    id: string
    description: string
    createdDate: string
  }>
}

interface CreateStageResponse {
  stageName: string
  stageKey: string
  deploymentId: string
  description: string
  createdDate: string
}

interface GetStagesResponse {
  item: Array<{
    stageName: string
    description: string
    deploymentId: string
    createdDate: string
    lastUpdatedDate: string
  }>
}

// Response types for HTTP API v2
interface CreateHttpApiResponse {
  apiId: string
  apiEndpoint: string
  name: string
  description?: string
  protocolType: string
  createdDate: string
}

interface GetHttpApisResponse {
  items: Array<{
    apiId: string
    name: string
    protocolType: string
    apiEndpoint: string
    createdDate: string
  }>
  nextToken?: string
}

interface GetHttpApiResponse {
  apiId: string
  name: string
  protocolType: string
  apiEndpoint: string
  description?: string
  disableExecuteApiEndpoint?: boolean
  createdDate: string
}

interface CreateRouteResponse {
  apiId: string
  routeKey: string
  routeId: string
}

interface GetRoutesResponse {
  items: Array<{
    apiId: string
    routeKey: string
    routeId: string
  }>
}

interface CreateIntegrationResponse {
  apiId: string
  integrationId: string
  integrationType: string
  integrationUri?: string
  payloadFormatVersion?: string
}

interface GetIntegrationsResponse {
  items: Array<{
    apiId: string
    integrationId: string
    integrationType: string
    integrationUri?: string
    integrationMethod?: string
  }>
}

interface CreateHttpApiStageResponse {
  apiId: string
  stageName: string
  createdDate: string
}

interface GetHttpApiStagesResponse {
  items: Array<{
    apiId: string
    stageName: string
    description?: string
    autoDeploy: boolean
    createdDate: string
  }>
}

interface UpdateRestApiResponse {
  id: string
  name: string
  description?: string
  createdDate: string
}

// REST API v1 Operations

/**
 * Create a REST API
 * Note: API Gateway REST API uses query parameters for basic info
 */
export async function createRestApi(params?: {
  name: string
  description?: string
  version?: string
  binaryMediaTypes?: string[]
  minimumCompressionSize?: number
  apiKeySource?: 'HEADER' | 'AUTHORIZER'
  endpointConfiguration?: {
    types: ('EDGE' | 'REGIONAL' | 'PRIVATE')[]
    vpcEndpointIds?: string[]
  }
  tags?: Record<string, string>
}): Promise<CreateRestApiResponse> {
  try {
    console.log('API Gateway service: Creating REST API with params:', params)
    
    // Build query parameters - API Gateway REST API uses query params for name/description
    const queryParams = new URLSearchParams()
    if (params?.name) queryParams.append('name', params.name)
    if (params?.description) queryParams.append('description', params.description)
    if (params?.version) queryParams.append('version', params.version)
    if (params?.apiKeySource) queryParams.append('apiKeySource', params.apiKeySource)
    
    const url = `/restapis${queryParams.toString() ? `?${queryParams}` : ''}`
    console.log('API Gateway service: POST to:', url)
    
    // For LocalStack API Gateway, send body with name/description as JSON
    console.log('API Gateway service: Making POST request...')
    const body = {
      name: params?.name || 'unnamed',
      description: params?.description || '',
    }
    console.log('API Gateway service: Request body:', body)
    
    const response = await api.post<CreateRestApiResponse>(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    console.log('API Gateway service: Response:', response)
    console.log('API Gateway service: Response data:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating REST API:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

/**
 * Get REST APIs
 */
export async function getRestApis(params?: {
  position?: string
  limit?: number
}): Promise<{ items: APIGatewayRestAPI[] }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.position) queryParams.append('position', params.position)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = `/restapis${queryParams.toString() ? `?${queryParams}` : ''}`
    console.log('API Gateway service: Getting REST APIs from:', url)
    
    const response = await api.get<{ item: APIGatewayRestAPI[]; items?: APIGatewayRestAPI[]; nextToken?: string }>(url)
    console.log('API Gateway service: Got REST APIs:', response.data)
    // LocalStack returns 'item' (singular), AWS returns 'items' (plural)
    const items = response.data.items || response.data.item || []
    console.log('API Gateway service: items count:', items.length)
    return { items }
  } catch (error) {
    console.error('Error getting REST APIs:', error)
    throw error
  }
}

/**
 * Get a REST API
 */
export async function getRestApi(apiId: string): Promise<CreateRestApiResponse> {
  try {
    const response = await api.get<CreateRestApiResponse>(`/restapis/${apiId}`)
    return response.data
  } catch (error) {
    console.error('Error getting REST API:', error)
    throw error
  }
}

/**
 * Update a REST API
 */
export async function updateRestApi(
  apiId: string,
  params: {
    name?: string
    description?: string
    version?: string
    apiKeySource?: 'HEADER' | 'AUTHORIZER'
    binaryMediaTypes?: string[]
    minimumCompressionSize?: number
  }
): Promise<CreateRestApiResponse> {
  try {
    // Build patch operations
    const patchOperations: Array<{ op: string; path: string; value?: string }> = []
    
    if (params.name !== undefined) {
      patchOperations.push({ op: 'replace', path: '/name', value: params.name })
    }
    if (params.description !== undefined) {
      patchOperations.push({ op: 'replace', path: '/description', value: params.description })
    }
    if (params.version !== undefined) {
      patchOperations.push({ op: 'replace', path: '/version', value: params.version })
    }
    if (params.apiKeySource !== undefined) {
      patchOperations.push({ op: 'replace', path: '/apiKeySource', value: params.apiKeySource })
    }
    
    const response = await api.patch<CreateRestApiResponse>(
      `/restapis/${apiId}`,
      patchOperations
    )
    return response.data
  } catch (error) {
    console.error('Error updating REST API:', error)
    throw error
  }
}

/**
 * Delete a REST API
 */
export async function deleteRestApi(apiId: string): Promise<void> {
  try {
    await api.delete(`/restapis/${apiId}`)
  } catch (error) {
    console.error('Error deleting REST API:', error)
    throw error
  }
}

/**
 * Create a resource
 */
export async function createResource(
  apiId: string,
  parentId: string,
  pathPart: string
): Promise<CreateResourceResponse> {
  try {
    const response = await api.post<CreateResourceResponse>(
      `/restapis/${apiId}/resources`,
      { pathPart },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Error creating resource:', error)
    throw error
  }
}

/**
 * Get resources
 */
export async function getResources(
  apiId: string,
  params?: {
    position?: string
    limit?: number
  }
): Promise<GetResourcesResponse> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.position) queryParams.append('position', params.position)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await api.get<GetResourcesResponse>(
      `/restapis/${apiId}/resources${queryParams.toString() ? `?${queryParams}` : ''}`
    )
    return response.data
  } catch (error) {
    console.error('Error getting resources:', error)
    throw error
  }
}

/**
 * Delete a resource
 */
export async function deleteResource(apiId: string, resourceId: string): Promise<void> {
  try {
    await api.delete(`/restapis/${apiId}/resources/${resourceId}`)
  } catch (error) {
    console.error('Error deleting resource:', error)
    throw error
  }
}

/**
 * Create a method
 */
export async function createMethod(
  apiId: string,
  resourceId: string,
  httpMethod: string,
  authorizationType: string,
  options?: {
    authorizationScopes?: string[]
    apiKeyRequired?: boolean
    requestParameters?: Record<string, boolean>
    requestModels?: Record<string, string>
    methodResponses?: Array<{
      statusCode: string
      responseParameters?: Record<string, boolean>
      responseModels?: Record<string, string>
    }>
  }
): Promise<CreateMethodResponse> {
  try {
    const response = await api.put<CreateMethodResponse>(
      `/restapis/${apiId}/resources/${resourceId}/methods/${httpMethod}`,
      {
        authorizationType,
        ...options,
      }
    )
    return response.data
  } catch (error) {
    console.error('Error creating method:', error)
    throw error
  }
}

/**
 * Get method
 */
export async function getMethod(
  apiId: string,
  resourceId: string,
  httpMethod: string
): Promise<GetMethodResponse> {
  try {
    const response = await api.get<GetMethodResponse>(
      `/restapis/${apiId}/resources/${resourceId}/methods/${httpMethod}`
    )
    return response.data
  } catch (error) {
    console.error('Error getting method:', error)
    throw error
  }
}

/**
 * Delete a method
 */
export async function deleteMethod(
  apiId: string,
  resourceId: string,
  httpMethod: string
): Promise<void> {
  try {
    await api.delete(`/restapis/${apiId}/resources/${resourceId}/methods/${httpMethod}`)
  } catch (error) {
    console.error('Error deleting method:', error)
    throw error
  }
}

/**
 * Create deployment
 */
export async function createDeployment(
  apiId: string,
  params?: {
    restApiId?: string
    stageName?: string
    stageDescription?: string
    description?: string
    cacheClusterEnabled?: boolean
    cacheClusterSize?: '0.5' | '1.6' | '6.1' | '13.5' | '28.4' | '58.2' | '118' | '237'
    variables?: Record<string, string>
    tracingEnabled?: boolean
  }
): Promise<CreateDeploymentResponse> {
  try {
    const response = await api.post<CreateDeploymentResponse>(
      `/restapis/${apiId}/deployments`,
      params
    )
    return response.data
  } catch (error) {
    console.error('Error creating deployment:', error)
    throw error
  }
}

/**
 * Get deployments
 */
export async function getDeployments(apiId: string): Promise<GetDeploymentsResponse> {
  try {
    const response = await api.get<GetDeploymentsResponse>(`/restapis/${apiId}/deployments`)
    return response.data
  } catch (error) {
    console.error('Error getting deployments:', error)
    throw error
  }
}

/**
 * Create stage
 */
export async function createStage(
  apiId: string,
  params: {
    stageName: string
    deploymentId: string
    description?: string
    cacheClusterEnabled?: boolean
    cacheClusterSize?: string
    variables?: Record<string, string>
    tracingEnabled?: boolean
    accessLogSettings?: {
      destinationArn: string
      format: string
    }
    documentationVersion?: string
    tags?: Record<string, string>
  }
): Promise<CreateStageResponse> {
  try {
    const response = await api.post<CreateStageResponse>(
      `/restapis/${apiId}/stages`,
      params
    )
    return response.data
  } catch (error) {
    console.error('Error creating stage:', error)
    throw error
  }
}

/**
 * Get stages
 */
export async function getStages(apiId: string): Promise<GetStagesResponse> {
  try {
    const response = await api.get<GetStagesResponse>(`/restapis/${apiId}/stages`)
    return response.data
  } catch (error) {
    console.error('Error getting stages:', error)
    throw error
  }
}

// HTTP API v2 Operations

/**
 * Create HTTP API
 */
export async function createHttpApi(params?: {
  name?: string
  description?: string
  protocolType?: 'HTTP'
  corsConfiguration?: {
    allowOrigins: string[]
    allowMethods?: string[]
    allowHeaders?: string[]
    exposeHeaders?: string[]
    maxAge?: number
  }
  disableExecuteApiEndpoint?: boolean
  tags?: Record<string, string>
}): Promise<CreateHttpApiResponse> {
  try {
    const response = await api.post<CreateHttpApiResponse>('/v2/apis', params)
    return response.data
  } catch (error) {
    console.error('Error creating HTTP API:', error)
    throw error
  }
}

/**
 * Get HTTP APIs
 */
export async function getHttpApis(params?: {
  nextToken?: string
  limit?: number
}): Promise<{ items: Array<{ apiId: string; name: string; protocolType: string; apiEndpoint: string; createdDate: string }>; nextToken?: string }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await api.get<{ item?: Array<{ apiId: string; name: string; protocolType: string; apiEndpoint: string; createdDate: string }>; items?: Array<{ apiId: string; name: string; protocolType: string; apiEndpoint: string; createdDate: string }>; nextToken?: string }>(
      `/v2/apis${queryParams.toString() ? `?${queryParams}` : ''}`
    )
    // LocalStack may return 'item' (singular) instead of 'items' (plural)
    const items = response.data.items || response.data.item || []
    return { items, nextToken: response.data.nextToken }
  } catch (error) {
    console.error('Error getting HTTP APIs:', error)
    throw error
  }
}

/**
 * Get HTTP API
 */
export async function getHttpApi(apiId: string): Promise<GetHttpApiResponse> {
  try {
    const response = await api.get<GetHttpApiResponse>(`/v2/apis/${apiId}`)
    return response.data
  } catch (error) {
    console.error('Error getting HTTP API:', error)
    throw error
  }
}

/**
 * Delete HTTP API
 */
export async function deleteHttpApi(apiId: string): Promise<void> {
  try {
    await api.delete(`/v2/apis/${apiId}`)
  } catch (error) {
    console.error('Error deleting HTTP API:', error)
    throw error
  }
}

/**
 * Create route
 */
export async function createRoute(
  apiId: string,
  params: {
    routeKey: string
    target?: string
  }
): Promise<CreateRouteResponse> {
  try {
    const response = await api.post<CreateRouteResponse>(
      `/v2/apis/${apiId}/routes`,
      params
    )
    return response.data
  } catch (error) {
    console.error('Error creating route:', error)
    throw error
  }
}

/**
 * Get routes
 */
export async function getRoutes(apiId: string): Promise<{ items: GetRoutesResponse['items'] }> {
  try {
    const response = await api.get<{ item?: GetRoutesResponse['items']; items?: GetRoutesResponse['items'] }>(`/v2/apis/${apiId}/routes`)
    // LocalStack may return 'item' (singular) instead of 'items' (plural)
    const items = response.data.items || response.data.item || []
    return { items }
  } catch (error) {
    console.error('Error getting routes:', error)
    throw error
  }
}

/**
 * Delete route
 */
export async function deleteRoute(apiId: string, routeId: string): Promise<void> {
  try {
    await api.delete(`/v2/apis/${apiId}/routes/${routeId}`)
  } catch (error) {
    console.error('Error deleting route:', error)
    throw error
  }
}

/**
 * Create integration
 */
export async function createIntegration(
  apiId: string,
  params: {
    integrationType: 'AWS_PROXY' | 'HTTP_PROXY' | 'AWS' | 'HTTP'
    integrationUri?: string
    integrationMethod?: string
    payloadFormatVersion?: string
    timeoutMillis?: number
    connectionType?: 'INTERNET' | 'VPC_LINK'
    connectionId?: string
  }
): Promise<CreateIntegrationResponse> {
  try {
    const response = await api.post<CreateIntegrationResponse>(
      `/v2/apis/${apiId}/integrations`,
      params
    )
    return response.data
  } catch (error) {
    console.error('Error creating integration:', error)
    throw error
  }
}

/**
 * Get integrations
 */
export async function getIntegrations(apiId: string): Promise<{ items: GetIntegrationsResponse['items'] }> {
  try {
    const response = await api.get<{ item?: GetIntegrationsResponse['items']; items?: GetIntegrationsResponse['items'] }>(
      `/v2/apis/${apiId}/integrations`
    )
    // LocalStack may return 'item' (singular) instead of 'items' (plural)
    const items = response.data.items || response.data.item || []
    return { items }
  } catch (error) {
    console.error('Error getting integrations:', error)
    throw error
  }
}

/**
 * Delete integration
 */
export async function deleteIntegration(apiId: string, integrationId: string): Promise<void> {
  try {
    await api.delete(`/v2/apis/${apiId}/integrations/${integrationId}`)
  } catch (error) {
    console.error('Error deleting integration:', error)
    throw error
  }
}

/**
 * Create stage for HTTP API
 */
export async function createHttpApiStage(
  apiId: string,
  params: {
    stageName: string
    autoDeploy?: boolean
    description?: string
    routeSettings?: Record<string, unknown>
    accessLogSettings?: {
      destinationArn: string
      format: string
    }
    defaultRouteSettings?: Record<string, unknown>
    tags?: Record<string, string>
  }
): Promise<CreateHttpApiStageResponse> {
  try {
    const response = await api.post<CreateHttpApiStageResponse>(
      `/v2/apis/${apiId}/stages`,
      params
    )
    return response.data
  } catch (error) {
    console.error('Error creating stage:', error)
    throw error
  }
}

/**
 * Get stages for HTTP API
 */
export async function getHttpApiStages(apiId: string): Promise<GetHttpApiStagesResponse> {
  try {
    const response = await api.get<GetHttpApiStagesResponse>(
      `/v2/apis/${apiId}/stages`
    )
    return response.data
  } catch (error) {
    console.error('Error getting stages:', error)
    throw error
  }
}
