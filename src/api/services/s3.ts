/**
 * S3 Service API Client
 * AWS SDK v3 implementation for S3-compatible storage
 * @module api/services/s3
 */

import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type ListBucketsCommandOutput,
  type CreateBucketCommandOutput,
  type ListObjectsCommandOutput,
  type GetObjectCommandOutput,
  type PutObjectCommandOutput,
  type DeleteObjectCommandOutput,
} from '@aws-sdk/client-s3'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'
import type { S3Bucket, S3Object } from '../types/aws'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  const settingsStore = useSettingsStore()
  const endpoint = settingsStore.endpoint

  s3Client = new S3Client({
    endpoint,
    region: settingsStore.region,
    credentials: {
      accessKeyId: settingsStore.accessKey,
      secretAccessKey: settingsStore.secretKey,
    },
    forcePathStyle: true,
    tls: false,
  })

  return s3Client
}

export function refreshS3Client(): void {
  s3Client = null
  getS3Client()
}

export class S3Service {
  private getClient(): S3Client {
    return getS3Client()
  }

  async listBuckets(): Promise<S3Bucket[]> {
    try {
      const client = this.getClient()
      const command = new ListBucketsCommand({})
      const response: ListBucketsCommandOutput = await client.send(command)
      
      return (response.Buckets || []).map(bucket => ({
        Name: bucket.Name || '',
        CreationDate: bucket.CreationDate?.toISOString() || '',
      }))
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('List buckets error:', error)
      throw new APIError('Failed to list buckets', 500, 's3')
    }
  }

  async createBucket(bucket: string, options?: {
    enableCors?: boolean
  }): Promise<CreateBucketCommandOutput> {
    try {
      const client = this.getClient()
      const command = new CreateBucketCommand({
        Bucket: bucket,
        ...(options?.enableCors && {
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2'],
                MaxAge: 3000,
              },
            ],
          },
        }),
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create bucket: ${bucket}`, 500, 's3')
    }
  }

  async deleteBucket(bucket: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteBucketCommand({
        Bucket: bucket,
      })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete bucket: ${bucket}`, 500, 's3')
    }
  }

  async headBucket(bucket: string): Promise<Record<string, string>> {
    try {
      const client = this.getClient()
      const command = new HeadBucketCommand({
        Bucket: bucket,
      })
      const response = await client.send(command)
      
      const headers: Record<string, string> = {}
      return headers
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to head bucket: ${bucket}`, 500, 's3')
    }
  }

  async listObjects(
    bucket: string,
    options?: {
      prefix?: string
      delimiter?: string
      marker?: string
      maxKeys?: number
    }
  ): Promise<{ objects: S3Object[]; prefixes: string[]; isTruncated: boolean; nextMarker?: string }> {
    try {
      const client = this.getClient()
      const command = new ListObjectsCommand({
        Bucket: bucket,
        Prefix: options?.prefix,
        Delimiter: options?.delimiter,
        Marker: options?.marker,
        MaxKeys: options?.maxKeys,
      })
      
      const response: ListObjectsCommandOutput = await client.send(command)
      
      const objects = (response.Contents || []).map(obj => ({
        Key: obj.Key || '',
        LastModified: obj.LastModified?.toISOString() || '',
        Size: obj.Size || 0,
        ETag: obj.ETag?.replace(/"/g, '') || '',
        StorageClass: obj.StorageClass || 'STANDARD',
      }))
      
      const prefixes = (response.CommonPrefixes || []).map(p => p.Prefix || '')
      
      return {
        objects,
        prefixes,
        isTruncated: response.IsTruncated || false,
        nextMarker: response.NextMarker,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list objects in bucket: ${bucket}`, 500, 's3')
    }
  }

  async getObject(bucket: string, key: string): Promise<{
    body: string
    contentType: string
    metadata: Record<string, string>
  }> {
    try {
      const client = this.getClient()
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
      
      const response: GetObjectCommandOutput = await client.send(command)
      
      const contentType = response.ContentType || 'application/octet-stream'
      let body = ''
      
      if (response.Body) {
        body = await response.Body.transformToString()
      }
      
      return {
        body,
        contentType,
        metadata: response.Metadata || {},
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get object: ${key}`, 500, 's3')
    }
  }

  async putObject(
    bucket: string,
    key: string,
    body: string | Uint8Array | Blob,
    contentType?: string
  ): Promise<PutObjectCommandOutput> {
    try {
      const client = this.getClient()
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
      
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to upload object: ${key}`, 500, 's3')
    }
  }

  async deleteObject(bucket: string, key: string): Promise<DeleteObjectCommandOutput> {
    try {
      const client = this.getClient()
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
      
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete object: ${key}`, 500, 's3')
    }
  }

  async headObject(bucket: string, key: string): Promise<Record<string, string>> {
    try {
      const client = this.getClient()
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
      
      const response = await client.send(command)
      
      const metadata: Record<string, string> = {
        contentLength: String(response.ContentLength || 0),
        contentType: response.ContentType || '',
        etag: response.ETag?.replace(/"/g, '') || '',
        lastModified: response.LastModified?.toISOString() || '',
      }
      
      return metadata
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to head object: ${key}`, 500, 's3')
    }
  }
}

export const s3Service = new S3Service()

export const listBuckets = () => s3Service.listBuckets()
export const createBucket = (bucket: string, options?: { enableCors?: boolean }) => 
  s3Service.createBucket(bucket, options)
export const deleteBucket = (bucket: string) => s3Service.deleteBucket(bucket)
export const headBucket = (bucket: string) => s3Service.headBucket(bucket)
export const headObject = (bucket: string, key: string) => s3Service.headObject(bucket, key)
export const listObjects = (bucket: string, options?: Parameters<S3Service['listObjects']>[1]) => 
  s3Service.listObjects(bucket, options)
export const listObjectsV2 = (bucket: string, options?: Parameters<S3Service['listObjects']>[1]) => 
  s3Service.listObjects(bucket, options)
export const getObject = (bucket: string, key: string) => s3Service.getObject(bucket, key)
export const putObject = (bucket: string, key: string, body: string | Uint8Array | Blob, contentType?: string) => 
  s3Service.putObject(bucket, key, body, contentType)
export const deleteObject = (bucket: string, key: string) => s3Service.deleteObject(bucket, key)

export const createFolder = async (bucket: string, folderPath: string): Promise<PutObjectCommandOutput> => {
  const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
  return s3Service.putObject(bucket, path, new Blob([''], { type: 'application/directory' }), 'application/directory')
}

export const getPresignedUrl = (bucket: string, key: string): string => {
  return `/${bucket}/${key}`
}

export default s3Service
