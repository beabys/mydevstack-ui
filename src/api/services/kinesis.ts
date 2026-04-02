/**
 * Kinesis Service API Client
 * AWS SDK v3 implementation for Amazon Kinesis
 * @module api/services/kinesis
 */

import {
  KinesisClient,
  CreateStreamCommand,
  DescribeStreamCommand,
  DescribeStreamSummaryCommand,
  DeleteStreamCommand,
  ListStreamsCommand,
  ListShardsCommand,
  GetRecordsCommand,
  GetShardIteratorCommand,
  PutRecordCommand,
  PutRecordsCommand,
  MergeShardsCommand,
  SplitShardCommand,
  UpdateShardCountCommand,
  EnableEnhancedMonitoringCommand,
  DisableEnhancedMonitoringCommand,
  type CreateStreamCommandOutput,
  type DescribeStreamCommandOutput,
  type DescribeStreamSummaryCommandOutput,
  type ListStreamsCommandOutput,
  type ListShardsCommandOutput,
  type GetRecordsCommandOutput,
  type GetShardIteratorCommandOutput,
  type PutRecordCommandOutput,
  type PutRecordsCommandOutput,
} from '@aws-sdk/client-kinesis'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let kinesisClient: KinesisClient | null = null

function getKinesisClient(): KinesisClient {
  const settingsStore = useSettingsStore()
  
  if (!kinesisClient) {
    kinesisClient = new KinesisClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return kinesisClient
}

export function refreshKinesisClient(): void {
  kinesisClient = null
  getKinesisClient()
}

export class KinesisService {
  private getClient(): KinesisClient {
    return getKinesisClient()
  }

  async createStream(streamName: string, options?: {
    ShardCount?: number
    StreamModeDetails?: { StreamMode: 'PROVISIONED' | 'ON_DEMAND' }
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new CreateStreamCommand({
        StreamName: streamName,
        ShardCount: options?.ShardCount,
        StreamModeDetails: options?.StreamModeDetails as any,
      })
      const response: CreateStreamCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create stream: ${streamName}`, 500, 'kinesis')
    }
  }

  async describeStream(streamName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeStreamCommand({ StreamName: streamName })
      const response: DescribeStreamCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe stream: ${streamName}`, 500, 'kinesis')
    }
  }

  async describeStreamSummary(streamName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeStreamSummaryCommand({ StreamName: streamName })
      const response: DescribeStreamSummaryCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to describe stream summary: ${streamName}`, 500, 'kinesis')
    }
  }

  async deleteStream(streamName: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteStreamCommand({ StreamName: streamName })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete stream: ${streamName}`, 500, 'kinesis')
    }
  }

  async listStreams(options?: { ExclusiveStartStreamName?: string; Limit?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListStreamsCommand(options as any)
      const response: ListStreamsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list streams', 500, 'kinesis')
    }
  }

  async listShards(streamName: string, options?: { ExclusiveStartShardId?: string; MaxResults?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListShardsCommand({
        StreamName: streamName,
        ...options,
      } as any)
      const response: ListShardsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to list shards: ${streamName}`, 500, 'kinesis')
    }
  }

  async getShardIterator(streamName: string, shardId: string, iteratorType: 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER' | 'LATEST' | 'TRIM_HORIZON'): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetShardIteratorCommand({
        StreamName: streamName,
        ShardId: shardId,
        ShardIteratorType: iteratorType,
      })
      const response: GetShardIteratorCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get shard iterator: ${shardId}`, 500, 'kinesis')
    }
  }

  async getRecords(shardIterator: string, options?: { Limit?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: options?.Limit,
      })
      const response: GetRecordsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get records', 500, 'kinesis')
    }
  }

  async putRecord(streamName: string, data: string, partitionKey: string, options?: {
    ExplicitHashKey?: string
    SequenceNumberForOrdering?: string
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutRecordCommand({
        StreamName: streamName,
        Data: Buffer.from(data),
        PartitionKey: partitionKey,
        ...options,
      })
      const response: PutRecordCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put record: ${streamName}`, 500, 'kinesis')
    }
  }

  async putRecords(streamName: string, records: Array<{ Data: string; PartitionKey: string }>): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutRecordsCommand({
        StreamName: streamName,
        Records: records.map(r => ({
          Data: Buffer.from(r.Data),
          PartitionKey: r.PartitionKey,
        })),
      })
      const response: PutRecordsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put records: ${streamName}`, 500, 'kinesis')
    }
  }

  async mergeShards(streamName: string, shardToMerge: string, adjacentShardToMerge: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new MergeShardsCommand({
        StreamName: streamName,
        ShardToMerge: shardToMerge,
        AdjacentShardToMerge: adjacentShardToMerge,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to merge shards', 500, 'kinesis')
    }
  }

  async splitShard(streamName: string, shardToSplit: string, newStartingHashKey: string): Promise<any> {
    try {
      const client = this.getClient()
      const command = new SplitShardCommand({
        StreamName: streamName,
        ShardToSplit: shardToSplit,
        NewStartingHashKey: newStartingHashKey,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to split shard: ${shardToSplit}`, 500, 'kinesis')
    }
  }

  async updateShardCount(streamName: string, targetShardCount: number): Promise<any> {
    try {
      const client = this.getClient()
      const command = new UpdateShardCountCommand({
        StreamName: streamName,
        TargetShardCount: targetShardCount,
        ScalingType: 'UNIFORM_SCALING',
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to update shard count: ${streamName}`, 500, 'kinesis')
    }
  }

  async enableEnhancedMonitoring(streamName: string, shardLevelMetrics: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new EnableEnhancedMonitoringCommand({
        StreamName: streamName,
        ShardLevelMetrics: shardLevelMetrics as any,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to enable enhanced monitoring: ${streamName}`, 500, 'kinesis')
    }
  }

  async disableEnhancedMonitoring(streamName: string, shardLevelMetrics: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DisableEnhancedMonitoringCommand({
        StreamName: streamName,
        ShardLevelMetrics: shardLevelMetrics as any,
      })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to disable enhanced monitoring: ${streamName}`, 500, 'kinesis')
    }
  }
}

export const kinesisService = new KinesisService()

export const createStream = (streamName: string, options?: any) => kinesisService.createStream(streamName, options)
export const describeStream = (streamName: string) => kinesisService.describeStream(streamName)
export const describeStreamSummary = (streamName: string) => kinesisService.describeStreamSummary(streamName)
export const deleteStream = (streamName: string) => kinesisService.deleteStream(streamName)
export const listStreams = (options?: any) => kinesisService.listStreams(options)
export const listShards = (streamName: string, options?: any) => kinesisService.listShards(streamName, options)
export const getShardIterator = (streamName: string, shardId: string, iteratorType?: string) => 
  kinesisService.getShardIterator(streamName, shardId, (iteratorType || 'LATEST') as any)
export const getRecords = (shardIterator: string, options?: any) => kinesisService.getRecords(shardIterator, options)
export const putRecord = (streamName: string, data: string, partitionKey: string, options?: any) => 
  kinesisService.putRecord(streamName, data, partitionKey, options)
export const putRecords = (streamName: string, records: any[]) => kinesisService.putRecords(streamName, records)
export const mergeShards = (streamName: string, shardToMerge: string, adjacentShardToMerge: string) => 
  kinesisService.mergeShards(streamName, shardToMerge, adjacentShardToMerge)
export const splitShard = (streamName: string, shardToSplit: string, newStartingHashKey: string) => 
  kinesisService.splitShard(streamName, shardToSplit, newStartingHashKey)
export const updateShardCount = (streamName: string, targetShardCount: number) => 
  kinesisService.updateShardCount(streamName, targetShardCount)
export const enableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) => 
  kinesisService.enableEnhancedMonitoring(streamName, shardLevelMetrics)
export const disableEnhancedMonitoring = (streamName: string, shardLevelMetrics: string[]) => 
  kinesisService.disableEnhancedMonitoring(streamName, shardLevelMetrics)

export default kinesisService
