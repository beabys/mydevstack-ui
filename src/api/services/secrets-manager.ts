/**
 * Secrets Manager Service API
 * Handles all AWS Secrets Manager operations via the API client
 */

import { api } from '../client'
import type { SecretsManagerSecret, SecretsManagerGetSecretValueResponse } from '../types/aws'

const TARGET_PREFIX = 'secretsmanager'

// Response types
interface CreateSecretResponse {
  ARN: string
  Name: string
  VersionId: string
}

interface ListSecretsResponse {
  SecretList: SecretsManagerSecret[]
  NextToken?: string
}

interface PutSecretValueResponse {
  ARN: string
  Name: string
  VersionId: string
  VersionStages: string[]
}

interface DeleteSecretResponse {
  ARN: string
  Name: string
  DeletionDate: string
}

interface UpdateSecretResponse {
  ARN: string
  Name: string
  VersionId: string
}

interface DescribeSecretResponse {
  ARN: string
  Name: string
  Description?: string
  KmsKeyId?: string
  RotationEnabled?: boolean
  RotationLambdaARN?: string
  RotationRules?: {
    AutomaticallyAfterDays: number
  }
  LastRotatedDate?: string
  LastChangedDate: string
  LastAccessedDate?: string
  Tags?: Array<{ Key: string; Value: string }>
  SecretVersionsToStages?: Record<string, string[]>
  CreatedDate: string
}

interface RotateSecretResponse {
  ARN: string
  Name: string
  VersionId: string
  RotationRules?: {
    AutomaticallyAfterDays: number
  }
  RotationLambdaArn?: string
}

interface GetRandomPasswordResponse {
  RandomPassword: string
}

interface RestoreSecretResponse {
  ARN: string
  Name: string
}

/**
 * Create a new secret
 */
export async function createSecret(params: {
  Name: string
  SecretString?: string
  SecretBinary?: string
  Description?: string
  KmsKeyId?: string
  Tags?: Array<{ Key: string; Value: string }>
  ClientRequestToken?: string
}): Promise<CreateSecretResponse> {
  try {
    const response = await api.post<CreateSecretResponse>('/secretsmanager', {
      Action: 'CreateSecret',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating secret:', error)
    throw error
  }
}

/**
 * Get a secret value
 */
export async function getSecretValue(SecretId: string, VersionId?: string, VersionStage?: string): Promise<SecretsManagerGetSecretValueResponse> {
  try {
    const response = await api.post<SecretsManagerGetSecretValueResponse>('/secretsmanager', {
      Action: 'GetSecretValue',
      SecretId,
      VersionId,
      VersionStage,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetSecretValue`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting secret value:', error)
    throw error
  }
}

/**
 * List secrets
 */
export async function listSecrets(params?: {
  MaxResults?: number
  NextToken?: string
  Filters?: Array<{
    Key?: 'name' | 'tag-key' | 'tag-value' | 'all'
    Values?: string[]
  }>
}): Promise<ListSecretsResponse> {
  try {
    const response = await api.post<ListSecretsResponse>('/secretsmanager', {
      Action: 'ListSecrets',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListSecrets`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing secrets:', error)
    throw error
  }
}

/**
 * Put a secret value
 */
export async function putSecretValue(params: {
  SecretId: string
  SecretString?: string
  SecretBinary?: string
  ClientRequestToken?: string
  VersionStages?: string[]
}): Promise<PutSecretValueResponse> {
  try {
    const response = await api.post<PutSecretValueResponse>('/secretsmanager', {
      Action: 'PutSecretValue',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutSecretValue`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting secret value:', error)
    throw error
  }
}

/**
 * Delete a secret
 */
export async function deleteSecret(
  SecretId: string,
  options?: {
    RecoveryWindowInDays?: number
    ForceDeleteWithoutRecovery?: boolean
  }
): Promise<DeleteSecretResponse> {
  try {
    const response = await api.post<DeleteSecretResponse>('/secretsmanager', {
      Action: 'DeleteSecret',
      SecretId,
      ...options,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error deleting secret:', error)
    throw error
  }
}

/**
 * Update a secret
 */
export async function updateSecret(params: {
  SecretId: string
  SecretString?: string
  SecretBinary?: string
  Description?: string
  KmsKeyId?: string
}): Promise<UpdateSecretResponse> {
  try {
    const response = await api.post<UpdateSecretResponse>('/secretsmanager', {
      Action: 'UpdateSecret',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.UpdateSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating secret:', error)
    throw error
  }
}

/**
 * Describe a secret
 */
export async function describeSecret(SecretId: string): Promise<DescribeSecretResponse> {
  try {
    const response = await api.post<DescribeSecretResponse>('/secretsmanager', {
      Action: 'DescribeSecret',
      SecretId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing secret:', error)
    throw error
  }
}

/**
 * Rotate a secret
 */
export async function rotateSecret(SecretId: string, options?: {
  RotationLambdaArn?: string
  RotationRules?: {
    AutomaticallyAfterDays: number
  }
  ClientRequestToken?: string
}): Promise<RotateSecretResponse> {
  try {
    const response = await api.post<RotateSecretResponse>('/secretsmanager', {
      Action: 'RotateSecret',
      SecretId,
      ...options,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.RotateSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error rotating secret:', error)
    throw error
  }
}

/**
 * Get random password
 */
export async function getRandomPassword(params?: {
  PasswordLength?: number
  ExcludeCharacters?: string
  ExcludePunctuation?: boolean
  ExcludeUppercase?: boolean
  ExcludeLowercase?: boolean
  IncludeEveryCharacterType?: boolean
  SpacesAllowed?: boolean
}): Promise<GetRandomPasswordResponse> {
  try {
    const response = await api.post<GetRandomPasswordResponse>('/secretsmanager', {
      Action: 'GetRandomPassword',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetRandomPassword`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting random password:', error)
    throw error
  }
}

/**
 * Tag a secret
 */
export async function tagSecret(SecretId: string, Tags: Array<{ Key: string; Value: string }>): Promise<void> {
  try {
    await api.post('/secretsmanager', {
      Action: 'TagResource',
      SecretId,
      Tags,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.TagResource`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error tagging secret:', error)
    throw error
  }
}

/**
 * Untag a secret
 */
export async function untagSecret(SecretId: string, TagKeys: string[]): Promise<void> {
  try {
    await api.post('/secretsmanager', {
      Action: 'UntagResource',
      SecretId,
      TagKeys,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.UntagResource`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error untagging secret:', error)
    throw error
  }
}

/**
 * Restore a secret
 */
export async function restoreSecret(SecretId: string): Promise<RestoreSecretResponse> {
  try {
    const response = await api.post<RestoreSecretResponse>('/secretsmanager', {
      Action: 'RestoreSecret',
      SecretId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.RestoreSecret`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error restoring secret:', error)
    throw error
  }
}
