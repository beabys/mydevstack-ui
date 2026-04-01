/**
 * KMS Service API
 * Handles all AWS Key Management Service operations via the API client
 */

import { api } from '../client'

const TARGET_PREFIX = 'TrentService'

// Response types
interface CreateKeyResponse {
  KeyMetadata: {
    AWSAccountId?: string
    KeyId: string
    Arn?: string
    KeyState?: string
    Description?: string
    KeyUsage?: string
    KeySpec?: string
    CreationDate?: string
    Enabled?: boolean
    DeletionDate?: string
  }
}

interface DescribeKeyResponse {
  KeyMetadata: {
    AWSAccountId?: string
    KeyId: string
    Arn?: string
    KeyState?: string
    Description?: string
    KeyUsage?: string
    KeySpec?: string
    CreationDate?: string
    Enabled?: boolean
    DeletionDate?: string
  }
}

interface ListKeysResponse {
  Keys: Array<{
    KeyId: string
    KeyArn?: string
  }>
  NextMarker?: string
  Truncated?: boolean
}

interface EncryptResponse {
  CiphertextBlob: string
  KeyId: string
  EncryptionAlgorithm?: string
}

interface DecryptResponse {
  Plaintext: string
  KeyId: string
  EncryptionAlgorithm?: string
}

interface GenerateDataKeyResponse {
  CiphertextBlob: string
  Plaintext: string
  KeyId: string
}

interface GenerateDataKeyWithoutPlaintextResponse {
  CiphertextBlob: string
  KeyId: string
}

interface SignResponse {
  Signature: string
  KeyId: string
  SigningAlgorithm?: string
}

interface VerifyResponse {
  KeyId: string
  SignatureValid: boolean
  SigningAlgorithm?: string
}

interface ScheduleKeyDeletionResponse {
  KeyId: string
  KeyState: string
  DeletionDate: string
}

interface CancelKeyDeletionResponse {
  KeyId: string
  KeyState: string
}

interface GetKeyRotationStatusResponse {
  KeyId: string
  KeyRotationEnabled: boolean
}

/**
 * Create a new KMS key
 */
export async function createKey(params?: {
  Description?: string
  KeyUsage?: 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT'
  CustomerMasterKeySpec?: 'SYMMETRIC_DEFAULT' | 'RSA_2048' | 'RSA_3072' | 'RSA_4096' | 'ECC_NIST_P256' | 'ECC_NIST_P384' | 'ECC_NIST_P521' | 'ECC_SECG_P256K1'
  KeySpec?: string
  Origin?: 'AWS_KMS' | 'EXTERNAL' | 'AWS_CLOUDHSM'
  CustomKeyStoreId?: string
  BypassPolicyLockoutSafetyCheck?: boolean
  Policy?: string
  Tags?: Array<{ TagKey: string; TagValue: string }>
}): Promise<CreateKeyResponse> {
  try {
    const response = await api.post<CreateKeyResponse>('/kms', {
      Action: 'CreateKey',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateKey`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating KMS key:', error)
    throw error
  }
}

/**
 * Describe a KMS key
 */
export async function describeKey(KeyId: string): Promise<DescribeKeyResponse> {
  try {
    const response = await api.post<DescribeKeyResponse>('/kms', {
      Action: 'DescribeKey',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeKey`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing KMS key:', error)
    throw error
  }
}

/**
 * List KMS keys
 */
export async function listKeys(params?: {
  Limit?: number
  Marker?: string
}): Promise<ListKeysResponse> {
  try {
    const response = await api.post<ListKeysResponse>('/kms', {
      Action: 'ListKeys',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListKeys`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing KMS keys:', error)
    throw error
  }
}

/**
 * Encrypt data using a KMS key
 */
export async function encrypt(params: {
  KeyId: string
  Plaintext: string
  EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
  GrantTokens?: string[]
}): Promise<EncryptResponse> {
  try {
    const response = await api.post<EncryptResponse>('/kms', {
      Action: 'Encrypt',
      KeyId: params.KeyId,
      Plaintext: params.Plaintext,
      EncryptionAlgorithm: params.EncryptionAlgorithm,
      GrantTokens: params.GrantTokens,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.Encrypt`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error encrypting with KMS:', error)
    throw error
  }
}

/**
 * Decrypt data using a KMS key
 */
export async function decrypt(params: {
  CiphertextBlob: string
  EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
  GrantTokens?: string[]
  KeyId?: string
}): Promise<DecryptResponse> {
  try {
    const response = await api.post<DecryptResponse>('/kms', {
      Action: 'Decrypt',
      CiphertextBlob: params.CiphertextBlob,
      EncryptionAlgorithm: params.EncryptionAlgorithm,
      GrantTokens: params.GrantTokens,
      KeyId: params.KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.Decrypt`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error decrypting with KMS:', error)
    throw error
  }
}

/**
 * Generate a data key
 */
export async function generateDataKey(params: {
  KeyId: string
  KeySpec?: 'AES_256' | 'AES_128'
  NumberOfBytes?: number
  EncryptionContext?: Record<string, string>
  GrantTokens?: string[]
}): Promise<GenerateDataKeyResponse> {
  try {
    const response = await api.post<GenerateDataKeyResponse>('/kms', {
      Action: 'GenerateDataKey',
      KeyId: params.KeyId,
      KeySpec: params.KeySpec,
      NumberOfBytes: params.NumberOfBytes,
      EncryptionContext: params.EncryptionContext,
      GrantTokens: params.GrantTokens,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GenerateDataKey`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error generating data key:', error)
    throw error
  }
}

/**
 * Generate a data key without plaintext
 */
export async function generateDataKeyWithoutPlaintext(params: {
  KeyId: string
  KeySpec?: 'AES_256' | 'AES_128'
  NumberOfBytes?: number
  EncryptionContext?: Record<string, string>
  GrantTokens?: string[]
}): Promise<GenerateDataKeyWithoutPlaintextResponse> {
  try {
    const response = await api.post<GenerateDataKeyWithoutPlaintextResponse>('/kms', {
      Action: 'GenerateDataKeyWithoutPlaintext',
      KeyId: params.KeyId,
      KeySpec: params.KeySpec,
      NumberOfBytes: params.NumberOfBytes,
      EncryptionContext: params.EncryptionContext,
      GrantTokens: params.GrantTokens,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GenerateDataKeyWithoutPlaintext`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error generating data key without plaintext:', error)
    throw error
  }
}

/**
 * Sign data using a KMS key
 */
export async function sign(params: {
  KeyId: string
  Message: string
  MessageType?: 'RAW' | 'DIGEST'
  SigningAlgorithm: 'RSASSA_PSS_SHA_256' | 'RSASSA_PSS_SHA_384' | 'RSASSA_PSS_SHA_512' | 'RSASSA_PKCS1_V1_5_SHA_256' | 'RSASSA_PKCS1_V1_5_SHA_384' | 'RSASSA_PKCS1_V1_5_SHA_512' | 'ECDSA_SHA_256' | 'ECDSA_SHA_384' | 'ECDSA_SHA_512'
}): Promise<SignResponse> {
  try {
    const response = await api.post<SignResponse>('/kms', {
      Action: 'Sign',
      KeyId: params.KeyId,
      Message: params.Message,
      MessageType: params.MessageType,
      SigningAlgorithm: params.SigningAlgorithm,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.Sign`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error signing with KMS:', error)
    throw error
  }
}

/**
 * Verify a signature
 */
export async function verify(params: {
  KeyId?: string
  Message: string
  Signature: string
  MessageType?: 'RAW' | 'DIGEST'
  SigningAlgorithm: string
}): Promise<VerifyResponse> {
  try {
    const response = await api.post<VerifyResponse>('/kms', {
      Action: 'Verify',
      KeyId: params.KeyId,
      Message: params.Message,
      Signature: params.Signature,
      MessageType: params.MessageType,
      SigningAlgorithm: params.SigningAlgorithm,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.Verify`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error verifying with KMS:', error)
    throw error
  }
}

/**
 * Enable a KMS key
 */
export async function enableKey(KeyId: string): Promise<void> {
  try {
    await api.post('/kms', {
      Action: 'EnableKey',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.EnableKey`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error enabling KMS key:', error)
    throw error
  }
}

/**
 * Disable a KMS key
 */
export async function disableKey(KeyId: string): Promise<void> {
  try {
    await api.post('/kms', {
      Action: 'DisableKey',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DisableKey`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error disabling KMS key:', error)
    throw error
  }
}

/**
 * Schedule key deletion
 */
export async function scheduleKeyDeletion(KeyId: string, PendingWindowInDays?: number): Promise<ScheduleKeyDeletionResponse> {
  try {
    const response = await api.post<ScheduleKeyDeletionResponse>('/kms', {
      Action: 'ScheduleKeyDeletion',
      KeyId,
      PendingWindowInDays,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ScheduleKeyDeletion`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error scheduling KMS key deletion:', error)
    throw error
  }
}

/**
 * Cancel key deletion
 */
export async function cancelKeyDeletion(KeyId: string): Promise<CancelKeyDeletionResponse> {
  try {
    const response = await api.post<CancelKeyDeletionResponse>('/kms', {
      Action: 'CancelKeyDeletion',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CancelKeyDeletion`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error canceling KMS key deletion:', error)
    throw error
  }
}

/**
 * Get key rotation status
 */
export async function getKeyRotationStatus(KeyId: string): Promise<GetKeyRotationStatusResponse> {
  try {
    const response = await api.post<GetKeyRotationStatusResponse>('/kms', {
      Action: 'GetKeyRotationStatus',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetKeyRotationStatus`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting key rotation status:', error)
    throw error
  }
}

/**
 * Enable key rotation
 */
export async function enableKeyRotation(KeyId: string): Promise<void> {
  try {
    await api.post('/kms', {
      Action: 'EnableKeyRotation',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.EnableKeyRotation`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error enabling key rotation:', error)
    throw error
  }
}

/**
 * Disable key rotation
 */
export async function disableKeyRotation(KeyId: string): Promise<void> {
  try {
    await api.post('/kms', {
      Action: 'DisableKeyRotation',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DisableKeyRotation`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error disabling key rotation:', error)
    throw error
  }
}

/**
 * Get key policy
 */
export async function getKeyPolicy(KeyId: string, PolicyName?: string): Promise<{ Policy: string }> {
  try {
    const response = await api.post<{ Policy: string }>('/kms', {
      Action: 'GetKeyPolicy',
      KeyId,
      PolicyName: PolicyName || 'default',
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetKeyPolicy`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting key policy:', error)
    throw error
  }
}

/**
 * List key policies
 */
export async function listKeyPolicies(KeyId: string): Promise<{ PolicyNames: string[] }> {
  try {
    const response = await api.post<{ PolicyNames: string[] }>('/kms', {
      Action: 'ListKeyPolicies',
      KeyId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListKeyPolicies`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing key policies:', error)
    throw error
  }
}
