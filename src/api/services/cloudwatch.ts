/**
 * CloudWatch Service API
 * Handles all Amazon CloudWatch operations via the API client
 */

import { api } from '../client'
import type { CloudWatchMetricData, CloudWatchLogGroup, CloudWatchLogStream } from '../types/aws'

const TARGET_PREFIX = 'CloudWatchLogs'

// Response type interfaces
interface DescribeLogGroupsResponse {
  logGroups: CloudWatchLogGroup[]
  nextToken?: string
}

interface DescribeLogStreamsResponse {
  logStreams: CloudWatchLogStream[]
  nextToken?: string
}

interface FilterLogEventsResponse {
  events: Array<{
    timestamp: number
    message: string
    ingestionTime: number
  }>
  nextForwardToken?: string
  nextBackwardToken?: string
}

interface GetMetricDataResponse {
  MetricDataResults: CloudWatchMetricData[]
  NextToken?: string
  Messages?: Array<{
    Code: string
    Value: string
  }>
}

interface GetMetricStatisticsResponse {
  Label: string
  Datapoints: Array<{
    Timestamp: string
    SampleCount?: number
    Average?: number
    Sum?: number
    Minimum?: number
    Maximum?: number
    Unit?: string
  }>
}

interface ListMetricsResponse {
  Metrics: Array<{
    Namespace: string
    MetricName: string
    Dimensions?: Array<{ Name: string; Value: string }>
  }>
  NextToken?: string
}

interface GetDashboardResponse {
  DashboardName: string
  DashboardBody: string
  LastModified: string
}

interface ListDashboardsResponse {
  DashboardEntries: Array<{
    DashboardName: string
    DashboardArn: string
    LastModified: string
    Size: number
  }>
}

/**
 * Create a CloudWatch log group
 */
export async function createLogGroup(params: {
  logGroupName: string
  kmsKeyId?: string
  tags?: Record<string, string>
}): Promise<void> {
  try {
    await api.post('/logs', {
      Action: 'CreateLogGroup',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateLogGroup`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error creating log group:', error)
    throw error
  }
}

/**
 * Describe CloudWatch log groups
 */
export async function describeLogGroups(params?: {
  logGroupNamePrefix?: string
  logGroupNamePattern?: string
  nextToken?: string
  limit?: number
}): Promise<DescribeLogGroupsResponse> {
  try {
    const response = await api.post<DescribeLogGroupsResponse>('/logs', {
      Action: 'DescribeLogGroups',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeLogGroups`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as DescribeLogGroupsResponse
  } catch (error) {
    console.error('Error describing log groups:', error)
    throw error
  }
}

/**
 * Delete a CloudWatch log group
 */
export async function deleteLogGroup(logGroupName: string): Promise<void> {
  try {
    await api.post('/logs', {
      Action: 'DeleteLogGroup',
      logGroupNamePrefix: logGroupName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteLogGroup`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting log group:', error)
    throw error
  }
}

/**
 * Create a CloudWatch log stream
 */
export async function createLogStream(params: {
  logGroupName: string
  logStreamName: string
}): Promise<void> {
  try {
    await api.post('/logs', {
      Action: 'CreateLogStream',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateLogStream`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error creating log stream:', error)
    throw error
  }
}

/**
 * Describe CloudWatch log streams
 */
export async function describeLogStreams(params: {
  logGroupName: string
  logStreamNamePrefix?: string
  orderBy?: 'LogStreamName' | 'LastEventTime'
  descending?: boolean
  nextToken?: string
  limit?: number
}): Promise<DescribeLogStreamsResponse> {
  try {
    const response = await api.post<DescribeLogStreamsResponse>('/logs', {
      Action: 'DescribeLogStreams',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeLogStreams`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as DescribeLogStreamsResponse
  } catch (error) {
    console.error('Error describing log streams:', error)
    throw error
  }
}

/**
 * Delete a CloudWatch log stream
 */
export async function deleteLogStream(params: {
  logGroupName: string
  logStreamName: string
}): Promise<void> {
  try {
    await api.post('/logs', {
      Action: 'DeleteLogStream',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteLogStream`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting log stream:', error)
    throw error
  }
}

/**
 * Put CloudWatch log events
 */
export async function putLogEvents(params: {
  logGroupName: string
  logStreamName: string
  logEvents: Array<{
    timestamp: number
    message: string
  }>
  sequenceToken?: string
}): Promise<{
  nextSequenceToken?: string
  rejectedLogEventsInfo?: {
    tooNewLogEventStartIndex: number
    tooOldLogEventEndIndex: number
    expiredLogEventEndIndex: number
  }
}> {
  try {
    const response = await api.post('/logs', {
      Action: 'PutLogEvents',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutLogEvents`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting log events:', error)
    throw error
  }
}

/**
 * Get CloudWatch log events
 */
export async function getLogEvents(params: {
  logGroupName: string
  logStreamName: string
  startTime?: number
  endTime?: number
  nextToken?: string
  limit?: number
  startFromHead?: boolean
  filterPattern?: string
}): Promise<FilterLogEventsResponse> {
  try {
    const response = await api.post<FilterLogEventsResponse>('/logs', {
      Action: 'FilterLogEvents',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.FilterLogEvents`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as FilterLogEventsResponse
  } catch (error) {
    console.error('Error getting log events:', error)
    throw error
  }
}

/**
 * Put CloudWatch metric data
 */
export async function putMetricData(params: {
  Namespace: string
  MetricData: Array<{
    MetricName: string
    Dimensions?: Array<{ Name: string; Value: string }>
    Timestamp?: string
    Value?: number
    StatisticValues?: {
      SampleCount: number
      Sum: number
      Minimum: number
      Maximum: number
    }
    Values?: number[]
    Counts?: number[]
    Unit?: 'Seconds' | 'Microseconds' | 'Milliseconds' | 'Bytes' | 'Kilobytes' | 'Megabytes' | 'Gigabytes' | 'Terabytes' | 'Bits' | 'Kilobits' | 'Megabits' | 'Gigabits' | 'Terabits' | 'Percent' | 'Count' | 'Bytes/Second' | 'Kilobytes/Second' | 'Megabytes/Second' | 'Gigabytes/Second' | 'Terabytes/Second' | 'Bits/Second' | 'Kilobits/Second' | 'Megabits/Second' | 'Gigabits/Second' | 'Terabits/Second' | 'Count/Second' | 'None'
    StorageResolution?: 1 | 60
  }>
}): Promise<void> {
  try {
    // CloudWatch Metrics uses Action parameter in query string
    await api.post('/cloudwatch', new URLSearchParams({
      Action: 'PutMetricData',
      Namespace: params.Namespace,
      MetricData: JSON.stringify(params.MetricData),
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error putting metric data:', error)
    throw error
  }
}

/**
 * Get CloudWatch metric data
 */
export async function getMetricData(params: {
  MetricDataQueries: Array<{
    Id: string
    MetricStat?: {
      Metric: {
        Namespace: string
        MetricName: string
        Dimensions?: Array<{ Name: string; Value: string }>
      }
      Period: number
      Stat: 'SampleCount' | 'Average' | 'Sum' | 'Minimum' | 'Maximum'
      Unit?: string
    }
    Expression?: string
    Label?: string
    ReturnData?: boolean
  }>
  StartTime: string
  EndTime: string
  NextToken?: string
  ScanBy?: 'TimestampDescending' | 'TimestampAscending'
  MaxResults?: number
}): Promise<GetMetricDataResponse> {
  try {
    const response = await api.post<GetMetricDataResponse>('/cloudwatch', new URLSearchParams({
      Action: 'GetMetricData',
      MetricDataQueries: JSON.stringify(params.MetricDataQueries),
      StartTime: params.StartTime,
      EndTime: params.EndTime,
      NextToken: params.NextToken || '',
      ScanBy: params.ScanBy || 'TimestampDescending',
      MaxResults: (params.MaxResults || 100).toString(),
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data as GetMetricDataResponse
  } catch (error) {
    console.error('Error getting metric data:', error)
    throw error
  }
}

/**
 * Get CloudWatch metric statistics
 */
export async function getMetricStatistics(params: {
  Namespace: string
  MetricName: string
  Dimensions?: Array<{ Name: string; Value: string }>
  StartTime: string
  EndTime: string
  Period: number
  Statistics: Array<'SampleCount' | 'Average' | 'Sum' | 'Minimum' | 'Maximum'>
  Unit?: string
}): Promise<GetMetricStatisticsResponse> {
  try {
    const urlParams = new URLSearchParams({
      Action: 'GetMetricStatistics',
      Namespace: params.Namespace,
      MetricName: params.MetricName,
      StartTime: params.StartTime,
      EndTime: params.EndTime,
      Period: params.Period.toString(),
      Statistics: JSON.stringify(params.Statistics),
    })
    
    if (params.Dimensions) {
      urlParams.append('Dimensions', JSON.stringify(params.Dimensions))
    }
    if (params.Unit) {
      urlParams.append('Unit', params.Unit)
    }

    const response = await api.post<GetMetricStatisticsResponse>('/cloudwatch', urlParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data as GetMetricStatisticsResponse
  } catch (error) {
    console.error('Error getting metric statistics:', error)
    throw error
  }
}

/**
 * List CloudWatch metrics
 */
export async function listMetrics(params?: {
  Namespace?: string
  MetricName?: string
  Dimensions?: Array<{ Name: string; Value: string }>
  NextToken?: string
  RecentlyActive?: 'PT5M'
}): Promise<ListMetricsResponse> {
  try {
    const urlParams = new URLSearchParams({
      Action: 'ListMetrics',
    })
    
    if (params?.Namespace) urlParams.append('Namespace', params.Namespace)
    if (params?.MetricName) urlParams.append('MetricName', params.MetricName)
    if (params?.NextToken) urlParams.append('NextToken', params.NextToken)
    if (params?.RecentlyActive) urlParams.append('RecentlyActive', params.RecentlyActive)

    const response = await api.post<ListMetricsResponse>('/cloudwatch', urlParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data as ListMetricsResponse
  } catch (error) {
    console.error('Error listing metrics:', error)
    throw error
  }
}

/**
 * Put CloudWatch dashboard
 */
export async function putDashboard(DashboardName: string, DashboardBody: string): Promise<{
  DashboardValidationMessages?: Array<{
    Data: string
    Message: string
  }>
}> {
  try {
    const response = await api.post('/cloudwatch', new URLSearchParams({
      Action: 'PutDashboard',
      DashboardName,
      DashboardBody,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting dashboard:', error)
    throw error
  }
}

/**
 * Get CloudWatch dashboard
 */
export async function getDashboard(DashboardName: string): Promise<GetDashboardResponse> {
  try {
    const response = await api.post<GetDashboardResponse>('/cloudwatch', new URLSearchParams({
      Action: 'GetDashboard',
      DashboardName,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data as GetDashboardResponse
  } catch (error) {
    console.error('Error getting dashboard:', error)
    throw error
  }
}

/**
 * List CloudWatch dashboards
 */
export async function listDashboards(): Promise<ListDashboardsResponse> {
  try {
    const response = await api.post<ListDashboardsResponse>('/cloudwatch', new URLSearchParams({
      Action: 'ListDashboards',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data as ListDashboardsResponse
  } catch (error) {
    console.error('Error listing dashboards:', error)
    throw error
  }
}

/**
 * Delete CloudWatch dashboard
 */
export async function deleteDashboard(DashboardName: string): Promise<void> {
  try {
    await api.post('/cloudwatch', new URLSearchParams({
      Action: 'DeleteDashboards',
      DashboardNames: DashboardName,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    throw error
  }
}
