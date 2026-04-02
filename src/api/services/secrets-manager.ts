/**
 * Secrets Manager Service API Client
 * AWS SDK v3 implementation for AWS Secrets Manager
 * @module api/services/secrets-manager
 */

import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  DeleteSecretCommand,
  UpdateSecretCommand,
  DescribeSecretCommand,
  ListSecretsCommand,
  RotateSecretCommand,
  GetRandomPasswordCommand,
  RestoreSecretCommand,
  type CreateSecretCommandOutput,
  type GetSecretValueCommandOutput,
  type PutSecretValueCommandOutput,
  type DeleteSecretCommandOutput,
  type UpdateSecretCommandOutput,
  type DescribeSecretCommandOutput,
  type ListSecretsCommandOutput,
  type RotateSecretCommandOutput,
  type GetRandomPasswordCommandOutput,
} from '@aws-sdk/client-secrets-manager'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let secretsManagerClient: SecretsManagerClient | null = null

function getSecretsManagerClient(): SecretsManagerClient {
  const settingsStore = useSettingsStore()
  
  if (!secretsManagerClient) {
    secretsManagerClient = new SecretsManagerClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return secretsManagerClient
}

export function refreshSecretsManagerClient(): void {
  secretsManagerClient = null
  getSecretsManagerClient()
}

export class SecretsManagerService {
  private getClient(): SecretsManagerClient {
    return getSecretsManagerClient()
  }

  async createSecret(params: {
    Name: string
    SecretString?: string
    SecretBinary?: string
    Description?: string
    KmsKeyId?: string
    Tags?: Array<{ Key: string; Value: string }>
    ClientRequestToken?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateSecretCommand(params as any)
      const response: CreateSecretCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create secret: ${params.Name}`, 500, 'secrets-manager')
    }
  }

  async getSecretValue(secretName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetSecretValueCommand({ SecretId: secretName })
      const response: GetSecretValueCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get secret value: ${secretName}`, 500, 'secrets-manager')
    }
  }

  async putSecretValue(params: {
    SecretId: string
    SecretString?: string
    SecretBinary?: string
    VersionStages?: string[]
    ClientRequestToken?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutSecretValueCommand(params as any)
      const response: PutSecretValueCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put secret value: ${params.SecretId}`, 500, 'secrets-manager')
    }
  }

  async deleteSecret(secretName: string, options?: {
    RecoveryWindowInDays?: number
    ForceDeleteWithoutRecovery?: boolean
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteSecretCommand({
        SecretId: secretName,
        ...options,
      })
      const response: DeleteSecretCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete secret: ${secretName}`, 500, 'secrets-manager')
    }
  }

  async updateSecret(params: {
    SecretId: string
    SecretString?: string
    SecretBinary?: string
    Description?: string
    KmsKeyId?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateSecretCommand(params as any)
      const response: UpdateSecretCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update secret: ${params.SecretId}`, 500, 'secrets-manager')
    }
  }

  async describeSecret(secretName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeSecretCommand({ SecretId: secretName })
      const response: DescribeSecretCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe secret: ${secretName}`, 500, 'secrets-manager')
    }
  }

  async listSecrets(options?: { MaxResults?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListSecretsCommand(options as any)
      const response: ListSecretsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list secrets', 500, 'secrets-manager')
    }
  }

  async rotateSecret(secretName: string, options?: {
    RotationLambdaARN?: string
    RotationRules?: { AutomaticallyAfterDays?: number }
    ClientRequestToken?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new RotateSecretCommand({
        SecretId: secretName,
        ...options,
      })
      const response: RotateSecretCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to rotate secret: ${secretName}`, 500, 'secrets-manager')
    }
  }

  async getRandomPassword(options?: {
    PasswordLength?: number
    ExcludeCharacters?: string
    ExcludePunctuation?: boolean
    ExcludeNumbers?: boolean
    ExcludeUppercase?: boolean
    ExcludeLowercase?: boolean
    IncludeSpace?: boolean
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetRandomPasswordCommand(options as any)
      const response: GetRandomPasswordCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to generate random password', 500, 'secrets-manager')
    }
  }

  async restoreSecret(secretName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new RestoreSecretCommand({ SecretId: secretName })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to restore secret: ${secretName}`, 500, 'secrets-manager')
    }
  }
}

export const secretsManagerService = new SecretsManagerService()

export const createSecret = (params: Parameters<SecretsManagerService['createSecret']>[0]) => 
  secretsManagerService.createSecret(params)
export const getSecretValue = (secretName: string) => secretsManagerService.getSecretValue(secretName)
export const putSecretValue = (params: Parameters<SecretsManagerService['putSecretValue']>[0]) => 
  secretsManagerService.putSecretValue(params)
export const deleteSecret = (secretName: string, options?: Parameters<SecretsManagerService['deleteSecret']>[1]) => 
  secretsManagerService.deleteSecret(secretName, options)
export const updateSecret = (params: Parameters<SecretsManagerService['updateSecret']>[0]) => 
  secretsManagerService.updateSecret(params)
export const describeSecret = (secretName: string) => secretsManagerService.describeSecret(secretName)
export const listSecrets = (options?: Parameters<SecretsManagerService['listSecrets']>[0]) => 
  secretsManagerService.listSecrets(options)
export const rotateSecret = (secretName: string, options?: Parameters<SecretsManagerService['rotateSecret']>[1]) => 
  secretsManagerService.rotateSecret(secretName, options)
export const getRandomPassword = (options?: Parameters<SecretsManagerService['getRandomPassword']>[0]) => 
  secretsManagerService.getRandomPassword(options)
export const restoreSecret = (secretName: string) => secretsManagerService.restoreSecret(secretName)

export default secretsManagerService
