/**
 * KMS Service API Client
 * AWS SDK v3 implementation for AWS Key Management Service
 * @module api/services/kms
 */

import {
  KMSClient,
  CreateKeyCommand,
  DescribeKeyCommand,
  ListKeysCommand,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  GenerateDataKeyWithoutPlaintextCommand,
  SignCommand,
  VerifyCommand,
  ScheduleKeyDeletionCommand,
  CancelKeyDeletionCommand,
  GetKeyRotationStatusCommand,
  EnableKeyRotationCommand,
  DisableKeyRotationCommand,
  PutKeyPolicyCommand,
  GetKeyPolicyCommand,
  ListAliasesCommand,
  type CreateKeyCommandOutput,
  type DescribeKeyCommandOutput,
  type ListKeysCommandOutput,
  type EncryptCommandOutput,
  type DecryptCommandOutput,
  type GenerateDataKeyCommandOutput,
  type SignCommandOutput,
  type VerifyCommandOutput,
} from '@aws-sdk/client-kms'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let kmsClient: KMSClient | null = null

function getKMSClient(): KMSClient {
  const settingsStore = useSettingsStore()
  
  if (!kmsClient) {
    kmsClient = new KMSClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return kmsClient
}

export function refreshKMSClient(): void {
  kmsClient = null
  getKMSClient()
}

export class KMSService {
  private getClient(): KMSClient {
    return getKMSClient()
  }

  async createKey(params?: {
    Description?: string
    KeyUsage?: 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT'
    CustomerMasterKeySpec?: string
    Origin?: 'AWS_KMS' | 'EXTERNAL' | 'AWS_CLOUDHSM'
    BypassPolicyLockoutSafetyCheck?: boolean
    Policy?: string
    Tags?: Array<{ TagKey: string; TagValue: string }>
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateKeyCommand(params as any)
      const response: CreateKeyCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to create KMS key', 500, 'kms')
    }
  }

  async describeKey(keyId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeKeyCommand({ KeyId: keyId })
      const response: DescribeKeyCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe KMS key: ${keyId}`, 500, 'kms')
    }
  }

  async listKeys(options?: { Limit?: number; Marker?: string }): Promise<{ Keys: any[]; NextMarker?: string; Truncated?: boolean }> {
    try {
      const client = this.getClient()
      const command = new ListKeysCommand(options as any)
      const response: ListKeysCommandOutput = await client.send(command)
      return {
        Keys: response.Keys || [],
        NextMarker: response.NextMarker,
        Truncated: response.Truncated,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list KMS keys', 500, 'kms')
    }
  }

  async encrypt(keyId: string, plaintext: string, options?: {
    EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
    GrantTokens?: string[]
  }): Promise<{ CiphertextBlob: Uint8Array; KeyId: string }> {
    try {
      const client = this.getClient()
      const command = new EncryptCommand({
        KeyId: keyId,
        Plaintext: Buffer.from(plaintext),
        ...options,
      })
      const response: EncryptCommandOutput = await client.send(command)
      return {
        CiphertextBlob: response.CiphertextBlob || new Uint8Array(),
        KeyId: response.KeyId || '',
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to encrypt with KMS key: ${keyId}`, 500, 'kms')
    }
  }

  async decrypt(ciphertextBlob: Uint8Array, options?: {
    EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
    GrantTokens?: string[]
  }): Promise<{ Plaintext: Uint8Array; KeyId: string }> {
    try {
      const client = this.getClient()
      const command = new DecryptCommand({
        CiphertextBlob: ciphertextBlob,
        ...options,
      })
      const response: DecryptCommandOutput = await client.send(command)
      return {
        Plaintext: response.Plaintext || new Uint8Array(),
        KeyId: response.KeyId || '',
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to decrypt with KMS', 500, 'kms')
    }
  }

  async generateDataKey(keyId: string, options?: {
    KeySpec?: 'AES_256' | 'AES_128'
    NumberOfBytes?: number
    GrantTokens?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GenerateDataKeyCommand({
        KeyId: keyId,
        ...options,
      })
      const response: GenerateDataKeyCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to generate data key: ${keyId}`, 500, 'kms')
    }
  }

  async generateDataKeyWithoutPlaintext(keyId: string, options?: {
    KeySpec?: 'AES_256' | 'AES_128'
    NumberOfBytes?: number
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GenerateDataKeyWithoutPlaintextCommand({
        KeyId: keyId,
        ...options,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to generate data key without plaintext: ${keyId}`, 500, 'kms')
    }
  }

  async sign(keyId: string, message: string, signingAlgorithm: string, options?: {
    GrantTokens?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new SignCommand({
        KeyId: keyId,
        Message: Buffer.from(message),
        MessageType: 'RAW',
        SigningAlgorithm: signingAlgorithm as any,
        ...options,
      })
      const response: SignCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to sign with KMS key: ${keyId}`, 500, 'kms')
    }
  }

  async verify(keyId: string, message: string, signature: Uint8Array, signingAlgorithm: string): Promise<{ KeyId: string; SignatureValid: boolean }> {
    try {
      const client = this.getClient()
      const command = new VerifyCommand({
        KeyId: keyId,
        Message: Buffer.from(message),
        MessageType: 'RAW',
        Signature: signature,
        SigningAlgorithm: signingAlgorithm as any,
      })
      const response: VerifyCommandOutput = await client.send(command)
      return {
        KeyId: response.KeyId || '',
        SignatureValid: response.SignatureValid || false,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to verify with KMS key: ${keyId}`, 500, 'kms')
    }
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays?: number): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ScheduleKeyDeletionCommand({
        KeyId: keyId,
        PendingWindowInDays: pendingWindowInDays,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to schedule key deletion: ${keyId}`, 500, 'kms')
    }
  }

  async cancelKeyDeletion(keyId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CancelKeyDeletionCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to cancel key deletion: ${keyId}`, 500, 'kms')
    }
  }

  async getKeyRotationStatus(keyId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get key rotation status: ${keyId}`, 500, 'kms')
    }
  }

  async enableKeyRotation(keyId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new EnableKeyRotationCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to enable key rotation: ${keyId}`, 500, 'kms')
    }
  }

  async disableKeyRotation(keyId: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DisableKeyRotationCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to disable key rotation: ${keyId}`, 500, 'kms')
    }
  }

  async enableKey(keyId: string): Promise<any> {
    const { EnableKeyCommand } = await import('@aws-sdk/client-kms')
    try {
      const client = this.getClient()
      const command = new EnableKeyCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to enable key: ${keyId}`, 500, 'kms')
    }
  }

  async disableKey(keyId: string): Promise<any> {
    const { DisableKeyCommand } = await import('@aws-sdk/client-kms')
    try {
      const client = this.getClient()
      const command = new DisableKeyCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to disable key: ${keyId}`, 500, 'kms')
    }
  }

  async getKeyPolicy(keyId: string, policyName: string = 'default'): Promise<any> {
    const { GetKeyPolicyCommand } = await import('@aws-sdk/client-kms')
    try {
      const client = this.getClient()
      const command = new GetKeyPolicyCommand({ KeyId: keyId, PolicyName: policyName })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get key policy: ${keyId}`, 500, 'kms')
    }
  }

  async listKeyPolicies(keyId: string): Promise<any> {
    const { ListKeyPoliciesCommand } = await import('@aws-sdk/client-kms')
    try {
      const client = this.getClient()
      const command = new ListKeyPoliciesCommand({ KeyId: keyId })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list key policies: ${keyId}`, 500, 'kms')
    }
  }

  async putKeyPolicy(keyId: string, policy: string, policyName: string = 'default'): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutKeyPolicyCommand({
        KeyId: keyId,
        Policy: policy,
        PolicyName: policyName,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put key policy: ${keyId}`, 500, 'kms')
    }
  }

  async listAliases(options?: { Limit?: number; Marker?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListAliasesCommand(options as any)
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list KMS aliases', 500, 'kms')
    }
  }
}

export const kmsService = new KMSService()

export const createKey = (params?: Parameters<KMSService['createKey']>[0]) => kmsService.createKey(params)
export const describeKey = (keyId: string) => kmsService.describeKey(keyId)
export const listKeys = (options?: Parameters<KMSService['listKeys']>[0]) => kmsService.listKeys(options)
export const encrypt = (keyId: string, plaintext: string, options?: Parameters<KMSService['encrypt']>[2]) => 
  kmsService.encrypt(keyId, plaintext, options)
export const decrypt = (ciphertextBlob: Uint8Array, options?: Parameters<KMSService['decrypt']>[1]) => 
  kmsService.decrypt(ciphertextBlob, options)
export const generateDataKey = (keyId: string, options?: Parameters<KMSService['generateDataKey']>[1]) => 
  kmsService.generateDataKey(keyId, options)
export const sign = (keyId: string, message: string, options?: Parameters<KMSService['sign']>[2]) => 
  kmsService.sign(keyId, message, options)
export const verify = (keyId: string, message: string, signature: Uint8Array, options?: Parameters<KMSService['verify']>[3]) => 
  kmsService.verify(keyId, message, signature, options)
export const scheduleKeyDeletion = (keyId: string, pendingWindowInDays?: number) => 
  kmsService.scheduleKeyDeletion(keyId, pendingWindowInDays)
export const cancelKeyDeletion = (keyId: string) => kmsService.cancelKeyDeletion(keyId)
export const getKeyRotationStatus = (keyId: string) => kmsService.getKeyRotationStatus(keyId)
export const enableKeyRotation = (keyId: string) => kmsService.enableKeyRotation(keyId)
export const disableKeyRotation = (keyId: string) => kmsService.disableKeyRotation(keyId)
export const enableKey = (keyId: string) => kmsService.enableKey(keyId)
export const disableKey = (keyId: string) => kmsService.disableKey(keyId)
export const getKeyPolicy = (keyId: string, policyName?: string) => kmsService.getKeyPolicy(keyId, policyName)
export const listKeyPolicies = (keyId: string) => kmsService.listKeyPolicies(keyId)
export const putKeyPolicy = (keyId: string, policy: string, policyName?: string) => 
  kmsService.putKeyPolicy(keyId, policy, policyName)
export const listAliases = (options?: any) => kmsService.listAliases(options)

export default kmsService
