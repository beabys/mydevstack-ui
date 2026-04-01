/**
 * SSM Parameter Store Service API
 * Handles all AWS Systems Manager Parameter Store operations via the API client
 */

import { api } from '../client'
import type { SSMParameter, SSMParameterHistory } from '../types/aws'

const TARGET_PREFIX = 'AmazonSSM'

// Response type for putParameter
interface PutParameterResponse {
  Version: number
  Tier: string
}

// Response type for getParameter
interface GetParameterResponse {
  Parameter: SSMParameter
}

// Response type for getParameters
interface GetParametersResponse {
  Parameters: SSMParameter[]
  InvalidParameters: string[]
}

// Response type for getParametersByPath
interface GetParametersByPathResponse {
  Parameters: SSMParameter[]
  NextToken?: string
}

// Response type for deleteParameters
interface DeleteParametersResponse {
  DeletedParameters: string[]
  InvalidParameters: string[]
}

// Extended parameter type for describeParameters (without extending SSMParameter to avoid conflicts)
interface DescribeParameter {
  Name: string
  Type: string
  Value?: string
  Version?: number
  Tier?: string
  LastModifiedDate?: string
  ARN?: string
  Description?: string
  AllowedPattern?: string
  Policies?: Array<{
    PolicyType: string
    PolicyContent: string
  }>
  DataType?: string
}

// Response type for describeParameters
interface DescribeParametersResponse {
  Parameters: DescribeParameter[]
  NextToken?: string
}

// Response type for getParameterHistory
interface GetParameterHistoryResponse {
  Parameters: SSMParameterHistory[]
  NextToken?: string
}

// Response type for listTagsForResource
interface ListTagsForResourceResponse {
  TagList: Array<{ Key: string; Value: string }>
}

// Response type for labelParameterVersion
interface LabelParameterVersionResponse {
  InvalidLabels: string[]
  ParameterVersion: number
}

// Response type for getParameterPolicy
interface GetParameterPolicyResponse {
  Policy: string
  PolicyType: string
  PolicyStatus: string
}

// Response type for listParameterPolicies
interface ListParameterPoliciesResponse {
  Policies: Array<{
    Name: string
    PolicyType: string
    PolicyStatus: string
    CreationDate: string
    LastModifiedDate: string
  }>
}

/**
 * Put a parameter
 */
export async function putParameter(params: {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value: string
  Description?: string
  AllowedPattern?: string
  KeyId?: string
  Overwrite?: boolean
  Tags?: Array<{ Key: string; Value: string }>
  Tier?: 'Standard' | 'Advanced' | 'Intelligent-Tiering'
  Policies?: string
  DataType?: string
}): Promise<PutParameterResponse> {
  try {
    const response = await api.post<PutParameterResponse>('/ssm', {
      Action: 'PutParameter',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutParameter`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting parameter:', error)
    throw error
  }
}

/**
 * Get a parameter
 */
export async function getParameter(Name: string, params?: {
  WithDecryption?: boolean
}): Promise<GetParameterResponse> {
  try {
    const response = await api.post<GetParameterResponse>('/ssm', {
      Action: 'GetParameter',
      Name,
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParameter`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameter:', error)
    throw error
  }
}

/**
 * Get parameters
 */
export async function getParameters(params: {
  Names: string[]
  WithDecryption?: boolean
}): Promise<GetParametersResponse> {
  try {
    const response = await api.post<GetParametersResponse>('/ssm', {
      Action: 'GetParameters',
      Names: params.Names,
      WithDecryption: params.WithDecryption,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParameters`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameters:', error)
    throw error
  }
}

/**
 * Get parameters by path
 */
export async function getParametersByPath(params: {
  Path: string
  Recursive?: boolean
  WithDecryption?: boolean
  ParameterFilters?: Array<{
    Key: string
    Option?: string
    Values?: string[]
  }>
  MaxResults?: number
  NextToken?: string
}): Promise<GetParametersByPathResponse> {
  try {
    const response = await api.post<GetParametersByPathResponse>('/ssm', {
      Action: 'GetParametersByPath',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParametersByPath`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameters by path:', error)
    throw error
  }
}

/**
 * Delete a parameter
 */
export async function deleteParameter(Name: string): Promise<void> {
  try {
    await api.post('/ssm', {
      Action: 'DeleteParameter',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteParameter`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting parameter:', error)
    throw error
  }
}

/**
 * Delete parameters
 */
export async function deleteParameters(Names: string[]): Promise<DeleteParametersResponse> {
  try {
    const response = await api.post<DeleteParametersResponse>('/ssm', {
      Action: 'DeleteParameters',
      Names,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteParameters`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error deleting parameters:', error)
    throw error
  }
}

/**
 * Describe parameters
 */
export async function describeParameters(params?: {
  ParameterFilters?: Array<{
    Key: string
    Option?: string
    Values?: string[]
  }>
  ParameterValidators?: Array<{
    Type: string
    ValidatorType: string
    ValidatorJson?: string
  }>
  MaxResults?: number
  NextToken?: string
}): Promise<DescribeParametersResponse> {
  try {
    const response = await api.post<DescribeParametersResponse>('/ssm', {
      Action: 'DescribeParameters',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeParameters`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing parameters:', error)
    throw error
  }
}

/**
 * Get parameter history
 */
export async function getParameterHistory(Name: string, params?: {
  MaxResults?: number
  NextToken?: string
  WithDecryption?: boolean
  ParameterFilters?: Array<{
    Key: string
    Option?: string
    Values?: string[]
  }>
}): Promise<GetParameterHistoryResponse> {
  try {
    const response = await api.post<GetParameterHistoryResponse>('/ssm', {
      Action: 'GetParameterHistory',
      Name,
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParameterHistory`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameter history:', error)
    throw error
  }
}

/**
 * Add tags to a parameter
 */
export async function addTagsToResource(params: {
  ResourceType: 'Parameter'
  ResourceId: string
  Tags: Array<{ Key: string; Value: string }>
}): Promise<void> {
  try {
    await api.post('/ssm', {
      Action: 'AddTagsToResource',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AddTagsToResource`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error adding tags to parameter:', error)
    throw error
  }
}

/**
 * Remove tags from a parameter
 */
export async function removeTagsFromResource(params: {
  ResourceType: 'Parameter'
  ResourceId: string
  TagKeys: string[]
}): Promise<void> {
  try {
    await api.post('/ssm', {
      Action: 'RemoveTagsFromResource',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.RemoveTagsFromResource`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error removing tags from parameter:', error)
    throw error
  }
}

/**
 * List tags for a parameter
 */
export async function listTagsForResource(params: {
  ResourceType: 'Parameter'
  ResourceId: string
}): Promise<ListTagsForResourceResponse> {
  try {
    const response = await api.post<ListTagsForResourceResponse>('/ssm', {
      Action: 'ListTagsForResource',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListTagsForResource`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing tags for parameter:', error)
    throw error
  }
}

/**
 * Label parameter version
 */
export async function labelParameterVersion(params: {
  Name: string
  Labels: string[]
  ParameterVersion?: number
}): Promise<LabelParameterVersionResponse> {
  try {
    const response = await api.post<LabelParameterVersionResponse>('/ssm', {
      Action: 'LabelParameterVersion',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.LabelParameterVersion`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error labeling parameter version:', error)
    throw error
  }
}

/**
 * Get parameter policy
 */
export async function getParameterPolicy(Name: string): Promise<GetParameterPolicyResponse> {
  try {
    const response = await api.post<GetParameterPolicyResponse>('/ssm', {
      Action: 'GetParameterPolicy',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParameterPolicy`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameter policy:', error)
    throw error
  }
}

/**
 * Put parameter policy
 */
export async function putParameterPolicy(params: {
  Name: string
  Policy: string
  PolicyType: string
  PolicyStatus?: 'Attached' | 'Detached'
}): Promise<void> {
  try {
    await api.post('/ssm', {
      Action: 'PutParameterPolicy',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutParameterPolicy`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error putting parameter policy:', error)
    throw error
  }
}

/**
 * Delete parameter policy
 */
export async function deleteParameterPolicy(Name: string): Promise<void> {
  try {
    await api.post('/ssm', {
      Action: 'DeleteParameterPolicy',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteParameterPolicy`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting parameter policy:', error)
    throw error
  }
}

/**
 * List parameter policies
 */
export async function listParameterPolicies(Name: string): Promise<ListParameterPoliciesResponse> {
  try {
    const response = await api.post<ListParameterPoliciesResponse>('/ssm', {
      Action: 'ListParameterPolicies',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListParameterPolicies`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing parameter policies:', error)
    throw error
  }
}

/**
 * Get parameters with path (alternative method)
 */
export async function getParametersByPathAlt(params: {
  Path: string
  Recursive?: boolean
  WithDecryption?: boolean
  Filters?: Array<{
    Key: string
    Values: string[]
    Option?: string
  }>
}): Promise<GetParametersByPathResponse> {
  try {
    const response = await api.post<GetParametersByPathResponse>('/ssm', {
      Action: 'GetParametersByPath',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetParametersByPath`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting parameters by path:', error)
    throw error
  }
}
