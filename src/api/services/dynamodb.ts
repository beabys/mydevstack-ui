/**
 * DynamoDB Service API Client
 * Provides operations for Amazon DynamoDB table and item management
 * @module api/services/dynamodb
 */

import { api, APIError } from '../client'
import type {
  DynamoDBTable,
  DynamoDBCreateTableRequest,
  DynamoDBItem,
} from '../types/aws'

// Response type interfaces for DynamoDB API calls
interface DynamoDBDescribeTableResponse {
  Table: {
    TableName: string
    TableArn: string
    TableStatus: string
    CreationDateTime: string
    KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
    AttributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
    BillingMode?: string
    ItemCount: number
    TableSizeBytes: number
    StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: string }
    GlobalSecondaryIndexes?: unknown[]
  }
}

interface DynamoDBListTablesResponse {
  TableNames: string[]
  LastEvaluatedTableName?: string
}

interface DynamoDBUpdateTableResponse {
  TableDescription: DynamoDBTable
}

interface DynamoDBQueryResponse {
  Items: DynamoDBItem[]
  Count: number
  ScannedCount: number
  LastEvaluatedKey?: DynamoDBItem
}

interface DynamoDBScanResponse {
  Items: DynamoDBItem[]
  Count: number
  ScannedCount: number
  LastEvaluatedKey?: DynamoDBItem
}

interface DynamoDBGetItemsResponse {
  Items: DynamoDBItem[]
  LastEvaluatedKey?: Record<string, unknown>
}

interface DynamoDBTimeToLiveResponse {
  TimeToLiveStatus: 'ENABLING' | 'ENABLED' | 'DISABLING' | 'DISABLED'
  AttributeName: string
}

interface DynamoDBUpdateTimeToLiveResponse {
  TimeToLiveSpecification: {
    Enabled: boolean
    AttributeName: string
  }
}

interface DynamoDBListStreamsResponse {
  Streams: Array<{
    StreamArn: string
    TableName: string
    StreamLabel: string
    StreamStatus: 'ENABLING' | 'ENABLED' | 'DISABLING' | 'DISABLED' | string
    StreamViewType: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | string
  }>
  LastEvaluatedStreamArn?: string
}

interface DynamoDBDescribeStreamResponse {
  StreamDescription: {
    StreamArn: string
    TableName: string
    StreamLabel: string
    StreamStatus: string
    StreamViewType: string
    Shards: Array<{
      ShardId: string
      ParentShardId?: string
      SequenceNumberRange: {
        StartingSequenceNumber: string
        EndingSequenceNumber?: string
      }
    }>
    LastEvaluatedShardId?: string
  }
}

interface DynamoDBGetShardIteratorResponse {
  ShardIterator: string
}

interface DynamoDBGetRecordsResponse {
  Records: Array<{
    eventID: string
    eventName: string
    eventVersion: string
    eventSource: string
    awsRegion: string
    dynamodb: {
      Keys?: Record<string, unknown>
      NewImage?: Record<string, unknown>
      OldImage?: Record<string, unknown>
      SequenceNumber: string
      SizeBytes: number
      StreamViewType: string
    }
    userIdentity?: {
      PrincipalId: string
    }
  }>
  NextShardIterator: string
  MillisBehindLatest: number
}

/**
 * Unmarshall DynamoDB item to plain JavaScript object
 */
export function unmarshall(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(item)) {
    if (value && typeof value === 'object') {
      const val = value as Record<string, unknown>
      if (val.S !== undefined) {
        result[key] = val.S
      } else if (val.N !== undefined) {
        result[key] = Number(val.N)
      } else if (val.B !== undefined) {
        result[key] = val.B
      } else if (val.BOOL !== undefined) {
        result[key] = val.BOOL
      } else if (val.NULL !== undefined) {
        result[key] = null
      } else if (val.L !== undefined) {
        result[key] = (val.L as unknown[]).map((l) => unmarshall(l as Record<string, unknown>))
      } else if (val.M !== undefined) {
        result[key] = unmarshall(val.M as Record<string, unknown>)
      } else if (val.SS !== undefined) {
        result[key] = val.SS
      } else if (val.NS !== undefined) {
        result[key] = (val.NS as string[]).map((n) => Number(n))
      } else if (val.BS !== undefined) {
        result[key] = val.BS
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Marshall plain JavaScript object to DynamoDB item format
 */
export function marshall(obj: Record<string, unknown>): DynamoDBItem {
  const result: DynamoDBItem = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue
    } else if (typeof value === 'string') {
      result[key] = { S: value }
    } else if (typeof value === 'number') {
      result[key] = { N: String(value) }
    } else if (typeof value === 'boolean') {
      result[key] = { BOOL: value }
    } else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'string') {
        result[key] = { SS: value as string[] }
      } else if (value.length > 0 && typeof value[0] === 'number') {
        result[key] = { NS: value.map((n) => String(n)) }
      } else {
        result[key] = { L: value.map((v) => marshall(v as Record<string, unknown>)) }
      }
    } else if (typeof value === 'object') {
      result[key] = { M: marshall(value as Record<string, unknown>) }
    }
  }
  
  return result
}

/**
 * DynamoDB Service client for interacting with AWS DynamoDB
 */
export class DynamoDBService {
  private basePath: string
  private customEndpoint?: string
  private targetPrefix: string = 'DynamoDB_20120810'

  constructor(customEndpoint?: string) {
    this.customEndpoint = customEndpoint
    this.basePath = '/'
  }

  /**
   * Get the base URL for DynamoDB requests
   */
  private getBaseUrl(): string {
    return this.customEndpoint || ''
  }

  /**
   * Create a DynamoDB request payload
   */
  private createRequest(action: string, params: Record<string, unknown> = {}): {
    Action: string
    [key: string]: unknown
  } {
    return {
      Action: action,
      ...params,
    }
  }

  /**
   * Create a table
   * @param request - Table creation parameters
   * @returns Promise resolving to created table
   * @throws {APIError} If the request fails
   */
  async createTable(request: DynamoDBCreateTableRequest): Promise<DynamoDBTable> {
    try {
      const response = await api.post<DynamoDBTable>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('CreateTable', request as unknown as Record<string, unknown>),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.CreateTable`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create table: ${request.TableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Delete a table
   * @param tableName - Name of the table to delete
   * @returns Promise resolving when table is deleted
   * @throws {APIError} If the request fails
   */
  async deleteTable(tableName: string): Promise<void> {
    try {
      await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('DeleteTable', { TableName: tableName }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.DeleteTable`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Describe a table
   * @param tableName - Name of the table
   * @returns Promise resolving to table description
   * @throws {APIError} If the request fails
   */
  async describeTable(tableName: string): Promise<{
    Table: {
      TableName: string
      TableArn: string
      TableStatus: string
      CreationDateTime: string
      KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
      AttributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
      ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
      BillingMode?: string
      ItemCount: number
      TableSizeBytes: number
      StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: string }
    }
  }> {
    try {
      const response = await api.post<DynamoDBDescribeTableResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('DescribeTable', { TableName: tableName }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.DescribeTable`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBDescribeTableResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * List all tables
   * @param options - Optional listing parameters
   * @returns Promise resolving to list of table names
   * @throws {APIError} If the request fails
   */
  async listTables(options?: {
    ExclusiveStartTableName?: string
    Limit?: number
  }): Promise<{
    TableNames: string[]
    LastEvaluatedTableName?: string
  }> {
    try {
      const response = await api.post<DynamoDBListTablesResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('ListTables', options || {}),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.ListTables`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBListTablesResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list tables', 500, 'dynamodb')
    }
  }

  /**
   * Update a table
   * @param tableName - Name of the table
   * @param updates - Table update parameters
   * @returns Promise resolving to updated table
   * @throws {APIError} If the request fails
   */
  async updateTable(
    tableName: string,
    updates: {
      AttributeDefinitions?: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
      BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
      ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
      GlobalSecondaryIndexUpdates?: unknown[]
      StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY' }
    }
  ): Promise<{
    TableDescription: DynamoDBTable
  }> {
    try {
      const response = await api.post<DynamoDBUpdateTableResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('UpdateTable', { TableName: tableName, ...updates }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.UpdateTable`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBUpdateTableResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Put an item into a table
   * @param tableName - Name of the table
   * @param item - Item to put
   * @param options - Optional parameters
   * @returns Promise resolving to put result
   * @throws {APIError} If the request fails
   */
  async putItem(
    tableName: string,
    item: DynamoDBItem,
    options?: {
      ConditionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, unknown>
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<{
    Attributes?: DynamoDBItem
    ConsumedCapacity?: unknown
    ItemCollectionKey?: unknown
  }> {
    try {
      const request: Record<string, unknown> = { TableName: tableName, Item: item }
      if (options) Object.assign(request, options)

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('PutItem', request),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.PutItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put item in table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Get an item from a table
   * @param tableName - Name of the table
   * @param key - Item key
   * @param options - Optional parameters
   * @returns Promise resolving to item
   * @throws {APIError} If the request fails
   */
  async getItem(
    tableName: string,
    key: DynamoDBItem,
    options?: {
      ProjectionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ConsistentRead?: boolean
    }
  ): Promise<{
    Item?: DynamoDBItem
    ConsumedCapacity?: unknown
  }> {
    try {
      const request: Record<string, unknown> = { TableName: tableName, Key: key }
      if (options) Object.assign(request, options)

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('GetItem', request),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.GetItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get item from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Delete an item from a table
   * @param tableName - Name of the table
   * @param key - Item key
   * @param options - Optional parameters
   * @returns Promise resolving to delete result
   * @throws {APIError} If the request fails
   */
  async deleteItem(
    tableName: string,
    key: DynamoDBItem,
    options?: {
      ConditionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, unknown>
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<{
    Attributes?: DynamoDBItem
    ConsumedCapacity?: unknown
  }> {
    try {
      const request: Record<string, unknown> = { TableName: tableName, Key: key }
      if (options) Object.assign(request, options)

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('DeleteItem', request),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.DeleteItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete item from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Update an item in a table
   * @param tableName - Name of the table
   * @param key - Item key
   * @param updates - Update expression
   * @param options - Optional parameters
   * @returns Promise resolving to update result
   * @throws {APIError} If the request fails
   */
  async updateItem(
    tableName: string,
    key: DynamoDBItem,
    updates: {
      UpdateExpression: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, unknown>
    },
    options?: {
      ConditionExpression?: string
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<{
    Attributes?: DynamoDBItem
    ConsumedCapacity?: unknown
  }> {
    try {
      const request: Record<string, unknown> = {
        TableName: tableName,
        Key: key,
        ...updates,
      }
      if (options) Object.assign(request, options)

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('UpdateItem', request),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.UpdateItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update item in table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Query a table
   * @param tableName - Name of the table
   * @param params - Query parameters
   * @returns Promise resolving to query results
   * @throws {APIError} If the request fails
   */
  async query(
    tableName: string,
    params: {
      KeyConditionExpression: string
      ExpressionAttributeValues?: Record<string, unknown>
      ExpressionAttributeNames?: Record<string, string>
      FilterExpression?: string
      ProjectionExpression?: string
      ScanIndexForward?: boolean
      Limit?: number
      ExclusiveStartKey?: DynamoDBItem
    }
  ): Promise<{
    Items: DynamoDBItem[]
    Count: number
    ScannedCount: number
    LastEvaluatedKey?: DynamoDBItem
  }> {
    try {
      const response = await api.post<DynamoDBQueryResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('Query', { TableName: tableName, ...params }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.Query`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBQueryResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to query table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Get items from a table (simple scan wrapper)
   * @param tableName - Name of the table
   * @param options - Optional parameters
   * @returns Promise resolving to items and last key
   * @throws {APIError} If the request fails
   */
  async getItems(
    tableName: string,
    options?: {
      limit?: number
      startKey?: DynamoDBItem
    }
  ): Promise<{
    items: Record<string, unknown>[]
    lastKey: Record<string, unknown> | null
  }> {
    try {
      const params: Record<string, unknown> = {
        TableName: tableName,
      }
      if (options?.limit) params.Limit = options.limit
      if (options?.startKey) params.ExclusiveStartKey = options.startKey
      
      const response = await api.post<DynamoDBGetItemsResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('Scan', params),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.Scan`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      
      const data = response.data as DynamoDBGetItemsResponse
      const items = (data.Items || []).map((item: DynamoDBItem) => unmarshall(item))
      return {
        items,
        lastKey: data.LastEvaluatedKey || null,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get items from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Scan a table
   * @param tableName - Name of the table
   * @param params - Scan parameters
   * @returns Promise resolving to scan results
   * @throws {APIError} If the request fails
   */
  async scan(
    tableName: string,
    params?: {
      FilterExpression?: string
      ExpressionAttributeValues?: Record<string, unknown>
      ExpressionAttributeNames?: Record<string, string>
      ProjectionExpression?: string
      Limit?: number
      Segment?: number
      TotalSegments?: number
      ExclusiveStartKey?: DynamoDBItem
    }
  ): Promise<{
    Items: DynamoDBItem[]
    Count: number
    ScannedCount: number
    LastEvaluatedKey?: DynamoDBItem
  }> {
    try {
      const response = await api.post<DynamoDBScanResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('Scan', { TableName: tableName, ...params }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.Scan`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBScanResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to scan table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Batch write items
   * @param tableName - Name of the table
   * @param items - Write request items
   * @returns Promise resolving to batch write result
   * @throws {APIError} If the request fails
   */
  async batchWriteItem(
    tableName: string,
    items: Array<{
      DeleteRequest?: { Key: DynamoDBItem }
      PutRequest?: { Item: DynamoDBItem }
    }>
  ): Promise<{
    UnprocessedItems?: Record<string, Array<{
      DeleteRequest?: { Key: DynamoDBItem }
      PutRequest?: { Item: DynamoDBItem }
    }>>
    ConsumedCapacity?: unknown[]
  }> {
    try {
      const requestBody = {
        RequestItems: {
          [tableName]: items,
        },
      }

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('BatchWriteItem', requestBody),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.BatchWriteItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to batch write to table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Batch get items
   * @param tableName - Name of the table
   * @param keys - Array of keys to get
   * @param options - Optional parameters
   * @returns Promise resolving to batch get result
   * @throws {APIError} If the request fails
   */
  async batchGetItem(
    tableName: string,
    keys: DynamoDBItem[],
    options?: {
      ProjectionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
    }
  ): Promise<{
    Responses?: { [key: string]: DynamoDBItem[] }
    UnprocessedKeys?: {
      [key: string]: {
        Keys: DynamoDBItem[]
        ProjectionExpression?: string
        ExpressionAttributeNames?: Record<string, string>
      }
    }
    ConsumedCapacity?: unknown[]
  }> {
    try {
      const requestBody: Record<string, unknown> = {
        RequestItems: {
          [tableName]: keys.map((key) => ({ Key: key })),
        },
      }
      if (options) {
        (requestBody.RequestItems as Record<string, unknown>)[tableName] = keys.map((key) => ({
          Key: key,
          ...options,
        }))
      }

      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('BatchGetItem', requestBody),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.BatchGetItem`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to batch get from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  /**
   * Transact write items
   * @param items - Array of transact write items
   * @returns Promise resolving to transact write result
   * @throws {APIError} If the request fails
   */
  async transactWriteItems(
    items: Array<{
      Put?: { TableName: string; Item: DynamoDBItem }
      Delete?: { TableName: string; Key: DynamoDBItem }
      Update?: { TableName: string; Key: DynamoDBItem; UpdateExpression: string }
    }>
  ): Promise<{
    ConsumedCapacity?: unknown[]
  }> {
    try {
      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('TransactWriteItems', { TransactItems: items }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.TransactWriteItems`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to transact write items', 500, 'dynamodb')
    }
  }

  /**
   * Transact get items
   * @param items - Array of transact get items
   * @returns Promise resolving to transact get result
   * @throws {APIError} If the request fails
   */
  async transactGetItems(
    items: Array<{
      Get: {
        TableName: string
        Key: DynamoDBItem
        ProjectionExpression?: string
        ExpressionAttributeNames?: Record<string, string>
      }
    }>
  ): Promise<{
    Responses?: Array<{ Item: DynamoDBItem }>
    ConsumedCapacity?: unknown[]
  }> {
    try {
      const response = await api.post(
        this.getBaseUrl() + this.basePath,
        this.createRequest('TransactGetItems', { TransactItems: items }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.TransactGetItems`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to transact get items', 500, 'dynamodb')
    }
  }

  // ==================== TTL ====================

  /**
   * Get time to live configuration for a table
   * @param tableName - Name of the table
   * @returns Promise resolving to TTL description
   * @throws {APIError} If the request fails
   */
  async getTimeToLive(tableName: string): Promise<{
    TimeToLiveStatus: 'ENABLING' | 'ENABLED' | 'DISABLING' | 'DISABLED'
    AttributeName: string
  }> {
    try {
      const response = await api.post<DynamoDBTimeToLiveResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('DescribeTimeToLive', { TableName: tableName }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.DescribeTimeToLive`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBTimeToLiveResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get time to live', 500, 'dynamodb')
    }
  }

  /**
   * Update time to live configuration for a table
   * @param tableName - Name of the table
   * @param enabled - Whether to enable TTL
   * @param attributeName - Name of the TTL attribute
   * @returns Promise resolving to update result
   * @throws {APIError} If the request fails
   */
  async updateTimeToLive(tableName: string, enabled: boolean, attributeName: string): Promise<{
    TimeToLiveSpecification: {
      Enabled: boolean
      AttributeName: string
    }
  }> {
    try {
      const response = await api.post<DynamoDBUpdateTimeToLiveResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('UpdateTimeToLive', {
          TableName: tableName,
          TimeToLiveSpecification: {
            Enabled: enabled,
            AttributeName: attributeName,
          },
        }),
        {
          headers: {
            'X-Amz-Target': `${this.targetPrefix}.UpdateTimeToLive`,
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBUpdateTimeToLiveResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to update time to live', 500, 'dynamodb')
    }
  }

  // ==================== DynamoDB Streams ====================

  /**
   * List streams for a table
   * @param tableName - Name of the table
   * @returns Promise resolving to list of streams
   * @throws {APIError} If the request fails
   */
  async listStreams(tableName?: string): Promise<DynamoDBListStreamsResponse> {
    try {
      const params: Record<string, unknown> = {}
      if (tableName) params.TableName = tableName
      
      const response = await api.post<DynamoDBListStreamsResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('ListStreams', params),
        {
          headers: {
            'X-Amz-Target': 'DynamoDBStreams_20120810.ListStreams',
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBListStreamsResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list streams', 500, 'dynamodb')
    }
  }

  /**
   * Describe a stream
   * @param streamArn - ARN of the stream
   * @returns Promise resolving to stream description
   * @throws {APIError} If the request fails
   */
  async describeStream(streamArn: string, params?: {
    Limit?: number
    ExclusiveStartShardId?: string
  }): Promise<DynamoDBDescribeStreamResponse> {
    try {
      const response = await api.post<DynamoDBDescribeStreamResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('DescribeStream', { StreamArn: streamArn, ...params }),
        {
          headers: {
            'X-Amz-Target': 'DynamoDBStreams_20120810.DescribeStream',
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBDescribeStreamResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe stream', 500, 'dynamodb')
    }
  }

  /**
   * Get shard iterator
   * @param streamArn - ARN of the stream
   * @param shardId - ID of the shard
   * @param iteratorType - Type of iterator
   * @returns Promise resolving to shard iterator
   * @throws {APIError} If the request fails
   */
  async getShardIterator(streamArn: string, shardId: string, iteratorType: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER' = 'LATEST', startingSequenceNumber?: string): Promise<DynamoDBGetShardIteratorResponse> {
    try {
      const params: Record<string, unknown> = {
        StreamArn: streamArn,
        ShardId: shardId,
        ShardIteratorType: iteratorType,
      }
      if (startingSequenceNumber) {
        params.StartingSequenceNumber = startingSequenceNumber
      }
      
      const response = await api.post<DynamoDBGetShardIteratorResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('GetShardIterator', params),
        {
          headers: {
            'X-Amz-Target': 'DynamoDBStreams_20120810.GetShardIterator',
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBGetShardIteratorResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get shard iterator', 500, 'dynamodb')
    }
  }

  /**
   * Get records from a stream
   * @param shardIterator - The shard iterator
   * @param limit - Maximum number of records to retrieve
   * @returns Promise resolving to stream records
   * @throws {APIError} If the request fails
   */
  async getRecords(shardIterator: string, limit?: number): Promise<DynamoDBGetRecordsResponse> {
    try {
      const params: Record<string, unknown> = {
        ShardIterator: shardIterator,
      }
      if (limit) params.Limit = limit
      
      const response = await api.post<DynamoDBGetRecordsResponse>(
        this.getBaseUrl() + this.basePath,
        this.createRequest('GetRecords', params),
        {
          headers: {
            'X-Amz-Target': 'DynamoDBStreams_20120810.GetRecords',
            'Content-Type': 'application/x-amz-json-1.0',
          },
        }
      )
      return response.data as DynamoDBGetRecordsResponse
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get records', 500, 'dynamodb')
    }
  }

  /**
   * Get stream specification for a table
   * @param tableName - Name of the table
   * @returns Promise resolving to stream specification
   * @throws {APIError} If the request fails
   */
  async getStreamSpecification(tableName: string): Promise<{ StreamEnabled: boolean; StreamViewType?: string }> {
    try {
      const tableDesc = await this.describeTable(tableName)
      return (tableDesc.Table as any).StreamSpecification || { StreamEnabled: false }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get stream specification for table: ${tableName}`, 500, 'dynamodb')
    }
  }
}

// Default export for singleton instance
export const dynamodbService = new DynamoDBService()

// Named exports for convenience
export const createTable = (request: DynamoDBCreateTableRequest) =>
  dynamodbService.createTable(request)
export const deleteTable = (tableName: string) => dynamodbService.deleteTable(tableName)
export const describeTable = (tableName: string) => dynamodbService.describeTable(tableName)
export const listTables = (options?: Parameters<DynamoDBService['listTables']>[0]) =>
  dynamodbService.listTables(options)
export const updateTable = (
  tableName: string,
  updates: Parameters<DynamoDBService['updateTable']>[1]
) => dynamodbService.updateTable(tableName, updates)
export const putItem = (
  tableName: string,
  item: DynamoDBItem,
  options?: Parameters<DynamoDBService['putItem']>[2]
) => dynamodbService.putItem(tableName, item, options)
export const getItem = (
  tableName: string,
  key: DynamoDBItem,
  options?: Parameters<DynamoDBService['getItem']>[2]
) => dynamodbService.getItem(tableName, key, options)
export const deleteItem = (
  tableName: string,
  key: DynamoDBItem,
  options?: Parameters<DynamoDBService['deleteItem']>[2]
) => dynamodbService.deleteItem(tableName, key, options)
export const updateItem = (
  tableName: string,
  key: DynamoDBItem,
  updates: Parameters<DynamoDBService['updateItem']>[2],
  options?: Parameters<DynamoDBService['updateItem']>[3]
) => dynamodbService.updateItem(tableName, key, updates, options)
export const query = (
  tableName: string,
  params: Parameters<DynamoDBService['query']>[1]
) => dynamodbService.query(tableName, params)
export const scan = (
  tableName: string,
  params?: Parameters<DynamoDBService['scan']>[1]
) => dynamodbService.scan(tableName, params)
export const getItems = (
  tableName: string,
  options?: Parameters<DynamoDBService['getItems']>[1]
) => dynamodbService.getItems(tableName, options)
export const batchWriteItem = (
  tableName: string,
  items: Parameters<DynamoDBService['batchWriteItem']>[1]
) => dynamodbService.batchWriteItem(tableName, items)
export const batchGetItem = (
  tableName: string,
  keys: DynamoDBItem[],
  options?: Parameters<DynamoDBService['batchGetItem']>[2]
) => dynamodbService.batchGetItem(tableName, keys, options)
export const transactWriteItems = (
  items: Parameters<DynamoDBService['transactWriteItems']>[0]
) => dynamodbService.transactWriteItems(items)
export const transactGetItems = (
  items: Parameters<DynamoDBService['transactGetItems']>[0]
) => dynamodbService.transactGetItems(items)

// DynamoDB Streams exports
export const listStreams = (tableName?: string) => dynamodbService.listStreams(tableName)
export const describeStream = (streamArn: string, params?: { Limit?: number; ExclusiveStartShardId?: string }) => 
  dynamodbService.describeStream(streamArn, params)
export const getShardIterator = (streamArn: string, shardId: string, iteratorType?: 'TRIM_HORIZON' | 'LATEST' | 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER', startingSequenceNumber?: string) => 
  dynamodbService.getShardIterator(streamArn, shardId, iteratorType, startingSequenceNumber)
export const getRecords = (shardIterator: string, limit?: number) => 
  dynamodbService.getRecords(shardIterator, limit)
export const getStreamSpecification = (tableName: string) => 
  dynamodbService.getStreamSpecification(tableName)

// TTL exports
export const getTimeToLive = (tableName: string) => dynamodbService.getTimeToLive(tableName)
export const updateTimeToLive = (tableName: string, enabled: boolean, attributeName: string) => 
  dynamodbService.updateTimeToLive(tableName, enabled, attributeName)

export default dynamodbService
