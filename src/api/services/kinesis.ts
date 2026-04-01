/**
 * Kinesis Service API
 * Handles all Amazon Kinesis Data Streams operations via the API client
 */

import { api } from '../client'
import type { KinesisStream, KinesisShard, KinesisRecord } from '../types/aws'

const TARGET_PREFIX = 'Kinesis_20131202'

// Response types
interface ListStreamsResponse {
  StreamNames: string[]
  StreamSummaries?: Array<{
    StreamName: string
    StreamARN: string
    StreamStatus: string
    StreamModeDetails?: {
      StreamMode: 'PROVISIONED' | 'ON_DEMAND'
    }
  }>
  HasMoreStreams: boolean
}

interface DescribeStreamResponse {
  StreamDescription: KinesisStream & {
    StreamCreationTimestamp: string
    EnhancedMonitoring: Array<{
      ShardLevelMetrics: string[]
    }>
    EncryptionType?: 'NONE' | 'KMS'
    KeyId?: string
  }
}

interface DescribeStreamSummaryResponse {
  StreamDescriptionSummary: {
    StreamName: string
    StreamARN: string
    StreamStatus: 'CREATING' | 'DELETING' | 'ACTIVE' | 'UPDATING'
    StreamModeDetails?: {
      StreamMode: 'PROVISIONED' | 'ON_DEMAND'
    }
    StreamCreationTimestamp: string
    ShardCount: number
    RetentionPeriodHours: number
    EnhancedMonitoring: Array<{
      ShardLevelMetrics: string[]
    }>
    EncryptionType: 'NONE' | 'KMS'
    KeyId?: string
    Tags: Array<{ Key: string; Value: string }>
  }
}

interface PutRecordResponse {
  ShardId: string
  SequenceNumber: string
  EncryptionType?: 'NONE' | 'KMS'
}

interface PutRecordsResponse {
  FailedRecordCount: number
  Records: Array<{
    SequenceNumber: string
    ShardId: string
    ErrorCode?: string
    ErrorMessage?: string
  }>
  EncryptionType?: 'NONE' | 'KMS'
}

interface GetRecordsResponse {
  Records: KinesisRecord[]
  NextShardIterator: string
  MillisBehindLatest: number
  ChildShards?: Array<{
    ShardId: string
    ParentShards: string[]
    HashKeyRange: {
      StartingHashKey: string
      EndingHashKey: string
    }
    WatermarkHookInformation?: string
  }>
}

interface GetShardIteratorResponse {
  ShardIterator: string
}

interface ListShardsResponse {
  Shards: KinesisShard[]
  NextToken?: string
  StreamARN?: string
}

interface RegisterStreamConsumerResponse {
  Consumer: {
    ConsumerName: string
    ConsumerARN: string
    ConsumerStatus: 'CREATING' | 'ACTIVE' | 'DELETING'
    ConsumerCreationTimestamp: string
  }
}

interface ListStreamConsumersResponse {
  Consumers: Array<{
    ConsumerName: string
    ConsumerARN: string
    ConsumerStatus: string
    ConsumerCreationTimestamp: string
  }>
  NextToken?: string
}

interface DescribeStreamConsumerResponse {
  ConsumerDescription: {
    ConsumerName: string
    ConsumerARN: string
    ConsumerStatus: string
    ConsumerCreationTimestamp: string
    StreamARN: string
  }
}

interface UpdateShardCountResponse {
  StreamName: string
  CurrentShardCount: number
  TargetShardCount: number
}

/**
 * Create a Kinesis stream
 */
export async function createStream(params: {
  StreamName: string
  ShardCount: number
}): Promise<void> {
  try {
    await api.post('/kinesis', {
      Action: 'CreateStream',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateStream`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error creating stream:', error)
    throw error
  }
}

/**
 * List Kinesis streams
 */
export async function listStreams(params?: {
  Limit?: number
  ExclusiveStartStreamName?: string
}): Promise<ListStreamsResponse> {
  try {
    const response = await api.post<ListStreamsResponse>('/kinesis', {
      Action: 'ListStreams',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListStreams`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing streams:', error)
    throw error
  }
}

/**
 * Describe a Kinesis stream
 */
export async function describeStream(params: {
  StreamName: string
  Limit?: number
  ExclusiveStartShardId?: string
}): Promise<DescribeStreamResponse> {
  try {
    const response = await api.post<DescribeStreamResponse>('/kinesis', {
      Action: 'DescribeStream',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeStream`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stream:', error)
    throw error
  }
}

/**
 * Describe a stream summary
 */
export async function describeStreamSummary(StreamName: string): Promise<DescribeStreamSummaryResponse> {
  try {
    const response = await api.post<DescribeStreamSummaryResponse>('/kinesis', {
      Action: 'DescribeStreamSummary',
      StreamName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeStreamSummary`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stream summary:', error)
    throw error
  }
}

/**
 * Delete a Kinesis stream
 */
export async function deleteStream(StreamName: string, params?: {
  EnforceConsumerDeletion?: boolean
}): Promise<void> {
  try {
    await api.post('/kinesis', {
      Action: 'DeleteStream',
      StreamName,
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteStream`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting stream:', error)
    throw error
  }
}

/**
 * Put a record to a Kinesis stream
 */
export async function putRecord(params: {
  Data: string
  StreamName: string
  PartitionKey: string
  ExplicitHashKey?: string
  SequenceNumberForOrdering?: string
}): Promise<PutRecordResponse> {
  try {
    const response = await api.post<PutRecordResponse>('/kinesis', {
      Action: 'PutRecord',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutRecord`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting record:', error)
    throw error
  }
}

/**
 * Put multiple records to a Kinesis stream
 */
export async function putRecords(params: {
  Records: Array<{
    Data: string
    ExplicitHashKey?: string
    PartitionKey: string
  }>
  StreamName: string
}): Promise<PutRecordsResponse> {
  try {
    const response = await api.post<PutRecordsResponse>('/kinesis', {
      Action: 'PutRecords',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutRecords`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting records:', error)
    throw error
  }
}

/**
 * Get records from a Kinesis stream
 */
export async function getRecords(params: {
  StreamName: string
  ShardIterator: string
  Limit?: number
}): Promise<GetRecordsResponse> {
  try {
    const response = await api.post<GetRecordsResponse>('/kinesis', {
      Action: 'GetRecords',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetRecords`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting records:', error)
    throw error
  }
}

/**
 * Get shard iterator
 */
export async function getShardIterator(params: {
  StreamName: string
  ShardId: string
  ShardIteratorType: 'AT_SEQUENCE_NUMBER' | 'AFTER_SEQUENCE_NUMBER' | 'TRIM_HORIZON' | 'LATEST' | 'AT_TIMESTAMP'
  StartingSequenceNumber?: string
  Timestamp?: string
}): Promise<GetShardIteratorResponse> {
  try {
    const response = await api.post<GetShardIteratorResponse>('/kinesis', {
      Action: 'GetShardIterator',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetShardIterator`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting shard iterator:', error)
    throw error
  }
}

/**
 * List shards
 */
export async function listShards(params: {
  StreamName: string
  MaxResults?: number
  NextToken?: string
  ShardFilter?: {
    ShardFilterType: 'AFTER_SHARD_ID' | 'AT_TRIM_HORIZON' | 'FROM_TRIM_HORIZON' | 'AT_LATEST' | 'AT_TIMESTAMP' | 'FROM_TIMESTAMP'
    ShardId?: string
    Timestamp?: string
  }
}): Promise<ListShardsResponse> {
  try {
    const response = await api.post<ListShardsResponse>('/kinesis', {
      Action: 'ListShards',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListShards`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing shards:', error)
    throw error
  }
}

/**
 * Register a stream consumer
 */
export async function registerStreamConsumer(params: {
  StreamARN: string
  ConsumerName: string
}): Promise<RegisterStreamConsumerResponse> {
  try {
    const response = await api.post<RegisterStreamConsumerResponse>('/kinesis', {
      Action: 'RegisterStreamConsumer',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.RegisterStreamConsumer`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error registering stream consumer:', error)
    throw error
  }
}

/**
 * List stream consumers
 */
export async function listStreamConsumers(params: {
  StreamARN: string
  MaxResults?: number
  NextToken?: string
  StreamCreationStatus?: 'ACTIVE' | 'CREATING' | 'DELETING' | 'UPDATED'
}): Promise<ListStreamConsumersResponse> {
  try {
    const response = await api.post<ListStreamConsumersResponse>('/kinesis', {
      Action: 'ListStreamConsumers',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListStreamConsumers`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing stream consumers:', error)
    throw error
  }
}

/**
 * Describe stream consumer
 */
export async function describeStreamConsumer(params: {
  StreamARN?: string
  ConsumerName?: string
  ConsumerARN?: string
}): Promise<DescribeStreamConsumerResponse> {
  try {
    const response = await api.post<DescribeStreamConsumerResponse>('/kinesis', {
      Action: 'DescribeStreamConsumer',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeStreamConsumer`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing stream consumer:', error)
    throw error
  }
}

/**
 * Deregister stream consumer
 */
export async function deregisterStreamConsumer(params: {
  StreamARN: string
  ConsumerName?: string
  ConsumerARN?: string
}): Promise<void> {
  try {
    await api.post('/kinesis', {
      Action: 'DeregisterStreamConsumer',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeregisterStreamConsumer`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deregistering stream consumer:', error)
    throw error
  }
}

/**
 * Split a shard
 */
export async function splitShard(params: {
  StreamName: string
  ShardToSplit: string
  NewStartingHashKey: string
  NewShardId?: string
}): Promise<void> {
  try {
    await api.post('/kinesis', {
      Action: 'SplitShard',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.SplitShard`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error splitting shard:', error)
    throw error
  }
}

/**
 * Merge two shards
 */
export async function mergeShards(params: {
  StreamName: string
  ShardToMerge: string
  AdjacentShardToMerge: string
}): Promise<void> {
  try {
    await api.post('/kinesis', {
      Action: 'MergeShards',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.MergeShards`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error merging shards:', error)
    throw error
  }
}

/**
 * Update the shard count
 */
export async function updateShardCount(params: {
  StreamName: string
  TargetShardCount: number
  ScalingType: 'UNIFORM_SCALING'
}): Promise<UpdateShardCountResponse> {
  try {
    const response = await api.post<UpdateShardCountResponse>('/kinesis', {
      Action: 'UpdateShardCount',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.UpdateShardCount`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating shard count:', error)
    throw error
  }
}
