/**
 * DynamoDB Service API Client
 * AWS SDK v3 implementation for DynamoDB
 * @module api/services/dynamodb
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  UpdateTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteItemCommand,
  BatchGetItemCommand,
  DescribeTimeToLiveCommand,
  UpdateTimeToLiveCommand,
  type CreateTableCommandOutput,
  type DeleteTableCommandOutput,
  type DescribeTableCommandOutput,
  type ListTablesCommandOutput,
  type UpdateTableCommandOutput,
  type PutItemCommandOutput,
  type GetItemCommandOutput,
  type DeleteItemCommandOutput,
  type UpdateItemCommandOutput,
  type QueryCommandOutput,
  type ScanCommandOutput,
  type BatchWriteItemCommandOutput,
  type BatchGetItemCommandOutput,
  type DescribeTimeToLiveCommandOutput,
  type UpdateTimeToLiveCommandOutput,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand as QueryCommandDoc, ScanCommand as ScanCommandDoc, PutCommand, GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let dynamodbClient: DynamoDBClient | null = null
let docClient: DynamoDBDocumentClient | null = null

function getDynamoDBClient(): DynamoDBClient {
  const settingsStore = useSettingsStore()
  
  if (!dynamodbClient) {
    dynamodbClient = new DynamoDBClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return dynamodbClient
}

function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    docClient = DynamoDBDocumentClient.from(getDynamoDBClient(), {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    })
  }
  return docClient
}

export function refreshDynamoDBClient(): void {
  dynamodbClient = null
  docClient = null
  getDynamoDBClient()
}

export class DynamoDBService {
  private getClient(): DynamoDBClient {
    return getDynamoDBClient()
  }

  private getDocClient(): DynamoDBDocumentClient {
    return getDocClient()
  }

  async createTable(request: {
    TableName: string
    KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
    AttributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
    BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
    GlobalSecondaryIndexes?: any[]
    StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: any }
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateTableCommand(request)
      const response: CreateTableCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create table: ${request.TableName}`, 500, 'dynamodb')
    }
  }

  async deleteTable(tableName: string): Promise<void> {
    try {
      const client = this.getClient()
      const command = new DeleteTableCommand({ TableName: tableName })
      await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async describeTable(tableName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeTableCommand({ TableName: tableName })
      const response: DescribeTableCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async listTables(options?: {
    ExclusiveStartTableName?: string
    Limit?: number
  }): Promise<{ TableNames: string[]; LastEvaluatedTableName?: string }> {
    try {
      const client = this.getClient()
      const command = new ListTablesCommand(options)
      const response: ListTablesCommandOutput = await client.send(command)
      return {
        TableNames: response.TableNames || [],
        LastEvaluatedTableName: response.LastEvaluatedTableName,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list tables', 500, 'dynamodb')
    }
  }

  async updateTable(
    tableName: string,
    updates: {
      AttributeDefinitions?: any[]
      BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
      ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
      GlobalSecondaryIndexUpdates?: any[]
      StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: any }
    }
  ): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateTableCommand({ TableName: tableName, ...updates })
      const response: UpdateTableCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async putItem(
    tableName: string,
    item: Record<string, any>,
    options?: {
      ConditionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, any>
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<any> {
    try {
      const client = this.getDocClient()
      const command = new PutCommand({
        TableName: tableName,
        Item: item,
        ...options,
      })
      const response = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put item in table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async getItem(
    tableName: string,
    key: Record<string, any>,
    options?: {
      ProjectionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ConsistentRead?: boolean
    }
  ): Promise<{ Item?: Record<string, any> }> {
    try {
      const client = this.getDocClient()
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
        ...options,
      })
      const response = await client.send(command)
      return { Item: response.Item }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get item from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async deleteItem(
    tableName: string,
    key: Record<string, any>,
    options?: {
      ConditionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, any>
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<any> {
    try {
      const client = this.getDocClient()
      const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
        ...options,
      })
      const response = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete item from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updates: {
      UpdateExpression: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, any>
    },
    options?: {
      ConditionExpression?: string
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<any> {
    try {
      const client = this.getDocClient()
      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        ...updates,
        ...options,
      })
      const response = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update item in table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async query(
    tableName: string,
    params: {
      KeyConditionExpression: string
      ExpressionAttributeValues?: Record<string, any>
      ExpressionAttributeNames?: Record<string, string>
      FilterExpression?: string
      ProjectionExpression?: string
      ScanIndexForward?: boolean
      Limit?: number
      ExclusiveStartKey?: Record<string, any>
    }
  ): Promise<{ Items: Record<string, any>[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Record<string, any> }> {
    try {
      const client = this.getDocClient()
      const command = new QueryCommandDoc({
        TableName: tableName,
        ...params,
      })
      const response = await client.send(command)
      return {
        Items: response.Items || [],
        Count: response.Count || 0,
        ScannedCount: response.ScannedCount || 0,
        LastEvaluatedKey: response.LastEvaluatedKey,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to query table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async scan(
    tableName: string,
    params?: {
      FilterExpression?: string
      ExpressionAttributeValues?: Record<string, any>
      ExpressionAttributeNames?: Record<string, string>
      ProjectionExpression?: string
      Limit?: number
      ExclusiveStartKey?: Record<string, any>
    }
  ): Promise<{ Items: Record<string, any>[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Record<string, any> }> {
    try {
      const client = this.getDocClient()
      const command = new ScanCommandDoc({
        TableName: tableName,
        ...params,
      })
      const response = await client.send(command)
      return {
        Items: response.Items || [],
        Count: response.Count || 0,
        ScannedCount: response.ScannedCount || 0,
        LastEvaluatedKey: response.LastEvaluatedKey,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to scan table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async getItems(
    tableName: string,
    options?: {
      limit?: number
      startKey?: Record<string, any>
    }
  ): Promise<{ items: Record<string, any>[]; lastKey: Record<string, any> | null }> {
    try {
      const client = this.getDocClient()
      const command = new ScanCommandDoc({
        TableName: tableName,
        Limit: options?.limit,
        ExclusiveStartKey: options?.startKey,
      })
      const response = await client.send(command)
      return {
        items: response.Items || [],
        lastKey: response.LastEvaluatedKey || null,
      }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get items from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async batchWriteItem(
    tableName: string,
    items: Array<{
      DeleteRequest?: { Key: Record<string, any> }
      PutRequest?: { Item: Record<string, any> }
    }>
  ): Promise<any> {
    try {
      const client = this.getClient()
      const command = new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: items,
        },
      })
      const response: BatchWriteItemCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to batch write to table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async batchGetItem(
    tableName: string,
    keys: Record<string, any>[],
    options?: {
      ProjectionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
    }
  ): Promise<{ Responses?: Record<string, any>[] }> {
    try {
      const client = this.getDocClient()
      const command = new BatchGetItemCommand({
        RequestItems: {
          [tableName]: {
            Keys: keys,
            ...options,
          },
        },
      })
      const response = await client.send(command)
      return { Responses: response.Responses?.[tableName] }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to batch get from table: ${tableName}`, 500, 'dynamodb')
    }
  }

  async getTimeToLive(tableName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeTimeToLiveCommand({ TableName: tableName })
      const response = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get time to live', 500, 'dynamodb')
    }
  }

  async updateTimeToLive(tableName: string, enabled: boolean, attributeName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          Enabled: enabled,
          AttributeName: attributeName,
        },
      })
      const response: UpdateTimeToLiveCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to update time to live', 500, 'dynamodb')
    }
  }

  async getStreamSpecification(tableName: string): Promise<{ StreamEnabled: boolean; StreamViewType?: string }> {
    try {
      const tableDesc = await this.describeTable(tableName)
      return tableDesc.Table?.StreamSpecification || { StreamEnabled: false }
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get stream specification for table: ${tableName}`, 500, 'dynamodb')
    }
  }
}

export const dynamodbService = new DynamoDBService()

export const createTable = (request: Parameters<DynamoDBService['createTable']>[0]) =>
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
  item: Record<string, any>,
  options?: Parameters<DynamoDBService['putItem']>[2]
) => dynamodbService.putItem(tableName, item, options)
export const getItem = (
  tableName: string,
  key: Record<string, any>,
  options?: Parameters<DynamoDBService['getItem']>[2]
) => dynamodbService.getItem(tableName, key, options)
export const deleteItem = (
  tableName: string,
  key: Record<string, any>,
  options?: Parameters<DynamoDBService['deleteItem']>[2]
) => dynamodbService.deleteItem(tableName, key, options)
export const updateItem = (
  tableName: string,
  key: Record<string, any>,
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
  keys: Record<string, any>[],
  options?: Parameters<DynamoDBService['batchGetItem']>[2]
) => dynamodbService.batchGetItem(tableName, keys, options)
export const getTimeToLive = (tableName: string) => dynamodbService.getTimeToLive(tableName)
export const updateTimeToLive = (tableName: string, enabled: boolean, attributeName: string) => 
  dynamodbService.updateTimeToLive(tableName, enabled, attributeName)
export const getStreamSpecification = (tableName: string) => 
  dynamodbService.getStreamSpecification(tableName)

// Helper function for DynamoDB - converts SDK response to plain JS objects
export const unmarshall = (item: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(item)) {
    if (value && typeof value === 'object') {
      const val = value as Record<string, any>
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
        result[key] = (val.L as any[]).map((l: any) => unmarshall(l))
      } else if (val.M !== undefined) {
        result[key] = unmarshall(val.M)
      } else if (val.SS !== undefined) {
        result[key] = val.SS
      } else if (val.NS !== undefined) {
        result[key] = (val.NS as string[]).map((n) => Number(n))
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }
  return result
}

// DynamoDB Streams exports - stubs for compatibility
// Note: DynamoDB Streams requires @aws-sdk/client-dynamodb-streams package
export const listStreams = async (tableName?: string): Promise<{ Streams: any[] }> => {
  return { Streams: [] }
}

export const describeStream = async (streamArn: string): Promise<any> => {
  throw new APIError('DynamoDB Streams not implemented in SDK v3', 500, 'dynamodb')
}

export const getShardIterator = async (streamArn: string, shardId: string, iteratorType?: string): Promise<any> => {
  throw new APIError('DynamoDB Streams not implemented in SDK v3', 500, 'dynamodb')
}

export const getRecords = async (shardIterator: string, limit?: number): Promise<any> => {
  throw new APIError('DynamoDB Streams not implemented in SDK v3', 500, 'dynamodb')
}

export default dynamodbService
