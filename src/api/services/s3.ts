/**
 * S3 Service API Client
 * Provides operations for Amazon S3 bucket and object management
 * @module api/services/s3
 */

import { api, APIError } from '../client'
import type {
  S3Bucket,
  S3Object,
} from '../types/aws'

// Type exports
export type UploadProgressCallback = (progress: number) => void

// Parse XML string to JSON
function parseXMLString(xml: string): any {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  // Check for parse errors
  const error = doc.querySelector('parsererror')
  if (error) {
    console.error('XML Parse Error:', error.textContent)
    return null
  }
  
  return xmlToJson(doc.documentElement)
}

// Convert XML element to JSON object
function xmlToJson(element: Element): any {
  const obj: any = {}
  
  // Process attributes
  if (element.attributes && element.attributes.length > 0) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      obj[`@${attr.name}`] = attr.value
    }
  }
  
  // Process child nodes
  const children = element.children
  const textContent: string[] = []
  
  for (const child of children) {
    const childName = child.tagName
    const childValue = xmlToJson(child)
    
    if (obj[childName]) {
      // Multiple children with same name - convert to array
      if (!Array.isArray(obj[childName])) {
        obj[childName] = [obj[childName]]
      }
      obj[childName].push(childValue)
    } else {
      obj[childName] = childValue
    }
  }
  
  // If no children, get text content
  if (children.length === 0) {
    return element.textContent?.trim() || ''
  }
  
  return obj
}

/**
 * S3 Service client for interacting with S3-compatible storage
 */
export class S3Service {
  /**
   * List all buckets
   */
  async listBuckets(): Promise<S3Bucket[]> {
    try {
      const response = await api.get('/', {
        headers: {
          Accept: 'application/xml',
        },
      })
      
      // Parse XML response
      const xmlData = parseXMLString(response.data as string)
      if (!xmlData) {
        throw new Error('Failed to parse XML response')
      }
      
      // Extract buckets from the response
      // Supports different response formats from various AWS emulators
      const bucketsResult = xmlData.ListAllMyBucketsResult || xmlData.ListAllMyBucketsResponse || {}
      const bucketsArray = bucketsResult.Buckets?.Bucket || []
      
      // Normalize to array
      const buckets = Array.isArray(bucketsArray) ? bucketsArray : [bucketsArray]
      
      return buckets.map((bucket: any) => ({
        Name: bucket.Name,
        CreationDate: bucket.CreationDate,
      }))
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error('List buckets error:', error)
      throw new APIError('Failed to list buckets', 500, 's3')
    }
  }

  /**
   * Create a new bucket
   */
  async createBucket(bucket: string): Promise<void> {
    try {
      await api.put(`/${bucket}`)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create bucket: ${bucket}`, 500, 's3')
    }
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(bucket: string): Promise<void> {
    try {
      await api.delete(`/${bucket}`)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete bucket: ${bucket}`, 500, 's3')
    }
  }

  /**
   * Check if a bucket exists
   */
  async headBucket(bucket: string): Promise<Record<string, string>> {
    try {
      const response = await api.head(`/${bucket}`)
      const headers: Record<string, string> = {}
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value
        }
      })
      return headers
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to head bucket: ${bucket}`, 500, 's3')
    }
  }

  /**
   * List objects in a bucket
   */
  async listObjects(
    bucket: string,
    options?: {
      prefix?: string
      delimiter?: string
      marker?: string
      maxKeys?: number
    }
  ): Promise<{ objects: S3Object[]; prefixes: string[] }> {
    try {
      const params = new URLSearchParams()
      if (options?.prefix) params.append('prefix', options.prefix)
      if (options?.delimiter) params.append('delimiter', options.delimiter || '/')
      if (options?.marker) params.append('marker', options.marker)
      if (options?.maxKeys) params.append('max-keys', String(options.maxKeys))
      
      const queryString = params.toString()
      const url = queryString ? `/${bucket}?${queryString}` : `/${bucket}`
      
      const response = await api.get(url, {
        headers: {
          Accept: 'application/xml',
        },
      })
      
      // Parse XML response
      const xmlData = parseXMLString(response.data as string)
      if (!xmlData) {
        return { objects: [], prefixes: [] }
      }
      
      // Extract results - handles both ListBucketResult and ListBucketResponse
      const listResult = xmlData.ListBucketResult || xmlData.ListBucketResponse?.ListBucketResult || {}
      const contents = listResult.Contents || []
      const commonPrefixes = listResult.CommonPrefixes || []
      
      // Normalize to arrays
      const objectsArray = Array.isArray(contents) ? contents : contents ? [contents] : []
      const prefixesArray = Array.isArray(commonPrefixes) ? commonPrefixes : commonPrefixes ? [commonPrefixes] : []
      
      return {
        objects: objectsArray.map((obj: any) => ({
          Key: obj.Key,
          LastModified: obj.LastModified,
          Size: parseInt(obj.Size, 10) || 0,
          ETag: obj.ETag?.replace(/"/g, '') || '',
          StorageClass: obj.StorageClass || 'STANDARD',
        })),
        prefixes: prefixesArray.map((p: any) => p.Prefix),
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list objects in bucket: ${bucket}`, 500, 's3')
    }
  }

  /**
   * Get an object
   */
  async getObject(bucket: string, key: string): Promise<{
    data: unknown
    contentType: string
    metadata: Record<string, string>
  }> {
    try {
      const response = await api.get(`/${bucket}/${key}`, {
        responseType: 'arraybuffer',
      })
      const contentType = response.headers['content-type'] || 'application/octet-stream'
      return {
        data: response.data,
        contentType,
        metadata: {},
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get object: ${key}`, 500, 's3')
    }
  }

  /**
   * Upload an object
   */
  async putObject(
    bucket: string,
    key: string,
    body: Blob | ArrayBuffer | string,
    contentType?: string
  ): Promise<string> {
    try {
      const response = await api.put(`/${bucket}/${key}`, body, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
        },
      })
      return response.headers.etag?.replace(/"/g, '') || ''
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to upload object: ${key}`, 500, 's3')
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      await api.delete(`/${bucket}/${key}`)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete object: ${key}`, 500, 's3')
    }
  }

  /**
   * Delete multiple objects
   */
  async deleteObjects(bucket: string, keys: string[]): Promise<{
    deleted: string[]
    errors: string[]
  }> {
    try {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Delete>
${keys.map(key => `  <Object><Key>${key}</Key></Object>`).join('\n')}
</Delete>`
      
      await api.post(`/${bucket}?delete`, xml, {
        headers: {
          'Content-Type': 'application/xml',
        },
      })
      
      return { deleted: keys, errors: [] }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete objects from bucket: ${bucket}`, 500, 's3')
    }
  }

  /**
   * Get object metadata (HEAD request)
   */
  async headObject(bucket: string, key: string): Promise<Record<string, string>> {
    try {
      const response = await api.head(`/${bucket}/${key}`)
      const metadata: Record<string, string> = {}
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          metadata[key] = value
        }
      })
      return metadata
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to head object: ${key}`, 500, 's3')
    }
  }

  /**
   * Get presigned URL
   */
  getPresignedUrl(bucket: string, key: string): string {
    return `/${bucket}/${key}`
  }
}

// Export singleton instance
export const s3Service = new S3Service()

// Export convenience functions
export const listBuckets = () => s3Service.listBuckets()
export const createBucket = (bucket: string) => s3Service.createBucket(bucket)
export const deleteBucket = (bucket: string) => s3Service.deleteBucket(bucket)
export const headBucket = (bucket: string) => s3Service.headBucket(bucket)
export const headObject = (bucket: string, key: string) => s3Service.headObject(bucket, key)
export const listObjects = (bucket: string, options?: { prefix?: string; delimiter?: string; marker?: string; maxKeys?: number }) => 
  s3Service.listObjects(bucket, options)
// listObjectsV2 is an alias for listObjects (AWS API uses both names)
export const listObjectsV2 = (bucket: string, options?: { prefix?: string; delimiter?: string; continuationToken?: string; maxKeys?: number }) => 
  s3Service.listObjects(bucket, options)
export const getObject = (bucket: string, key: string) => s3Service.getObject(bucket, key)
export const putObject = (bucket: string, key: string, body: Blob | ArrayBuffer | string, contentType?: string) => 
  s3Service.putObject(bucket, key, body, contentType)
export const deleteObject = (bucket: string, key: string) => s3Service.deleteObject(bucket, key)
export const deleteObjects = (bucket: string, keys: string[]) => s3Service.deleteObjects(bucket, keys)

/**
 * Create a folder (empty object with key ending in /)
 */
export const createFolder = async (bucket: string, folderPath: string): Promise<string> => {
  const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
  return s3Service.putObject(bucket, path, new Blob([''], { type: 'application/directory' }), 'application/directory')
}

/**
 * Upload object with progress callback
 */
export const uploadObjectWithProgress = async (
  bucket: string,
  key: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || ''
        resolve(etag)
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })
    
    xhr.open('PUT', `/${bucket}/${key}`)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

/**
 * Get presigned URL
 */
export const getPresignedUrl = (bucket: string, key: string): string => {
  return `/${bucket}/${key}`
}

/**
 * Generate presigned URL
 */
export const generatePresignedUrl = (bucket: string, key: string): string => {
  return getPresignedUrl(bucket, key)
}

export default s3Service
