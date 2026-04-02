/**
 * CloudWatch Service API Client
 * AWS SDK v3 implementation for Amazon CloudWatch
 * @module api/services/cloudwatch
 */

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  DescribeAlarmHistoryCommand,
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
  EnableAlarmActionsCommand,
  DisableAlarmActionsCommand,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
  PutMetricDataCommand,
  GetMetricWidgetImageCommand,
  DescribeInsightRulesCommand,
  GetInsightRuleReportCommand,
  type DescribeAlarmsCommandOutput,
  type DescribeAlarmHistoryCommandOutput,
  type PutMetricAlarmCommandOutput,
  type GetMetricStatisticsCommandOutput,
  type ListMetricsCommandOutput,
  type PutMetricDataCommandOutput,
  type DescribeInsightRulesCommandOutput,
  type GetInsightRuleReportCommandOutput,
} from '@aws-sdk/client-cloudwatch'
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
  GetLogEventsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutRetentionPolicyCommand,
  type DescribeLogGroupsCommandOutput,
  type DescribeLogStreamsCommandOutput,
  type FilterLogEventsCommandOutput,
  type GetLogEventsCommandOutput,
} from '@aws-sdk/client-cloudwatch-logs'
import { useSettingsStore } from '@/stores/settings'
import { APIError } from '../client'

let cloudWatchClient: CloudWatchClient | null = null
let cloudWatchLogsClient: CloudWatchLogsClient | null = null

function getCloudWatchClient(): CloudWatchClient {
  const settingsStore = useSettingsStore()
  
  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return cloudWatchClient
}

function getCloudWatchLogsClient(): CloudWatchLogsClient {
  const settingsStore = useSettingsStore()
  
  if (!cloudWatchLogsClient) {
    cloudWatchLogsClient = new CloudWatchLogsClient({
      endpoint: settingsStore.endpoint,
      region: settingsStore.region,
      credentials: {
        accessKeyId: settingsStore.accessKey,
        secretAccessKey: settingsStore.secretKey,
      },
      tls: false,
    })
  }
  
  return cloudWatchLogsClient
}

export function refreshCloudWatchClient(): void {
  cloudWatchClient = null
  cloudWatchLogsClient = null
  getCloudWatchClient()
}

export class CloudWatchService {
  private getClient(): CloudWatchClient {
    return getCloudWatchClient()
  }

  private getLogsClient(): CloudWatchLogsClient {
    return getCloudWatchLogsClient()
  }

  // CloudWatch Metrics
  async describeAlarms(options?: { AlarmNamePrefix?: string; MaxRecords?: number; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeAlarmsCommand(options as any)
      const response: DescribeAlarmsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe alarms', 500, 'cloudwatch')
    }
  }

  async describeAlarmHistory(alarmName?: string, options?: { StartDate?: Date; EndDate?: Date; MaxRecords?: number }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeAlarmHistoryCommand({ AlarmName: alarmName, ...options } as any)
      const response: DescribeAlarmHistoryCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe alarm history', 500, 'cloudwatch')
    }
  }

  async putMetricAlarm(params: {
    AlarmName: string
    AlarmDescription?: string
    MetricName: string
    Namespace: string
    Statistic?: string
    Period?: number
    EvaluationPeriods?: number
    Threshold?: number
    ComparisonOperator?: string
    AlarmActions?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutMetricAlarmCommand(params as any)
      const response: PutMetricAlarmCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put metric alarm: ${params.AlarmName}`, 500, 'cloudwatch')
    }
  }

  async deleteAlarms(alarmNames: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DeleteAlarmsCommand({ AlarmNames: alarmNames })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to delete alarms', 500, 'cloudwatch')
    }
  }

  async enableAlarmActions(alarmNames: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new EnableAlarmActionsCommand({ AlarmNames: alarmNames })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to enable alarm actions', 500, 'cloudwatch')
    }
  }

  async disableAlarmActions(alarmNames: string[]): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DisableAlarmActionsCommand({ AlarmNames: alarmNames })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to disable alarm actions', 500, 'cloudwatch')
    }
  }

  async getMetricStatistics(params: {
    Namespace: string
    MetricName: string
    StartTime: Date
    EndTime: Date
    Period: number
    Statistics?: string[]
    ExtendedStatistics?: string[]
  }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetMetricStatisticsCommand(params as any)
      const response: GetMetricStatisticsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get metric statistics', 500, 'cloudwatch')
    }
  }

  async listMetrics(options?: { Namespace?: string; MetricName?: string; NextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new ListMetricsCommand(options as any)
      const response: ListMetricsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to list metrics', 500, 'cloudwatch')
    }
  }

  async putMetricData(namespace: string, metricData: Array<{
    MetricName: string
    Value?: number
    Timestamp?: Date
    Unit?: string
  }>): Promise<any> {
    try {
      const client = this.getClient()
      const command = new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: metricData as any,
      })
      const response: PutMetricDataCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to put metric data', 500, 'cloudwatch')
    }
  }

  // CloudWatch Logs
  async describeLogGroups(options?: { logGroupNamePrefix?: string; limit?: number; nextToken?: string }): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new DescribeLogGroupsCommand(options as any)
      const response: DescribeLogGroupsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe log groups', 500, 'cloudwatch')
    }
  }

  async describeLogStreams(logGroupName: string, options?: { logStreamNamePrefix?: string; orderBy?: string; limit?: number }): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new DescribeLogStreamsCommand({
        logGroupName,
        ...options,
      } as any)
      const response: DescribeLogStreamsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe log streams', 500, 'cloudwatch')
    }
  }

  async filterLogEvents(logGroupName: string, options?: {
    filterPattern?: string
    startTime?: number
    limit?: number
  }): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new FilterLogEventsCommand({
        logGroupName,
        ...options,
      } as any)
      const response: FilterLogEventsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to filter log events', 500, 'cloudwatch')
    }
  }

  async getLogEvents(logGroupName: string, logStreamName: string, options?: { startTime?: number; limit?: number }): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new GetLogEventsCommand({
        logGroupName,
        logStreamName,
        ...options,
      } as any)
      const response: GetLogEventsCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to get log events', 500, 'cloudwatch')
    }
  }

  async createLogGroup(logGroupName: string): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new CreateLogGroupCommand({ logGroupName })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to create log group: ${logGroupName}`, 500, 'cloudwatch')
    }
  }

  async deleteLogGroup(logGroupName: string): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new DeleteLogGroupCommand({ logGroupName })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to delete log group: ${logGroupName}`, 500, 'cloudwatch')
    }
  }

  async putRetentionPolicy(logGroupName: string, retentionInDays: number): Promise<any> {
    try {
      const client = this.getLogsClient()
      const command = new PutRetentionPolicyCommand({ logGroupName, retentionInDays })
      return await client.send(command)
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to put retention policy: ${logGroupName}`, 500, 'cloudwatch')
    }
  }

  async describeInsightRules(options?: { maxResults?: number; nextToken?: string }): Promise<any> {
    try {
      const client = this.getClient()
      const command = new DescribeInsightRulesCommand(options as any)
      const response: DescribeInsightRulesCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError('Failed to describe insight rules', 500, 'cloudwatch')
    }
  }

  async getInsightRuleReport(ruleName: string, startTime: Date, endTime: Date): Promise<any> {
    try {
      const client = this.getClient()
      const command = new GetInsightRuleReportCommand({
        RuleName: ruleName,
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
      })
      const response: GetInsightRuleReportCommandOutput = await client.send(command)
      return response
    } catch (error) {
      if (error instanceof APIError) throw error
      throw new APIError(`Failed to get insight rule report: ${ruleName}`, 500, 'cloudwatch')
    }
  }
}

export const cloudWatchService = new CloudWatchService()

export const describeAlarms = (options?: any) => cloudWatchService.describeAlarms(options)
export const describeAlarmHistory = (alarmName?: string, options?: any) => 
  cloudWatchService.describeAlarmHistory(alarmName, options)
export const putMetricAlarm = (params: any) => cloudWatchService.putMetricAlarm(params)
export const deleteAlarms = (alarmNames: string[]) => cloudWatchService.deleteAlarms(alarmNames)
export const enableAlarmActions = (alarmNames: string[]) => cloudWatchService.enableAlarmActions(alarmNames)
export const disableAlarmActions = (alarmNames: string[]) => cloudWatchService.disableAlarmActions(alarmNames)
export const getMetricStatistics = (params: any) => cloudWatchService.getMetricStatistics(params)
export const listMetrics = (options?: any) => cloudWatchService.listMetrics(options)
export const putMetricData = (namespace: string, metricData: any[]) => 
  cloudWatchService.putMetricData(namespace, metricData)
export const describeLogGroups = (options?: any) => cloudWatchService.describeLogGroups(options)
export const describeLogStreams = (logGroupName: string, options?: any) => 
  cloudWatchService.describeLogStreams(logGroupName, options)
export const filterLogEvents = (logGroupName: string, options?: any) => 
  cloudWatchService.filterLogEvents(logGroupName, options)
export const getLogEvents = (logGroupName: string, logStreamName: string, options?: any) => 
  cloudWatchService.getLogEvents(logGroupName, logStreamName, options)
export const createLogGroup = (logGroupName: string) => cloudWatchService.createLogGroup(logGroupName)
export const deleteLogGroup = (logGroupName: string) => cloudWatchService.deleteLogGroup(logGroupName)
export const putRetentionPolicy = (logGroupName: string, retentionInDays: number) => 
  cloudWatchService.putRetentionPolicy(logGroupName, retentionInDays)
export const describeInsightRules = (options?: any) => cloudWatchService.describeInsightRules(options)
export const getInsightRuleReport = (ruleName: string, startTime: Date, endTime: Date) => 
  cloudWatchService.getInsightRuleReport(ruleName, startTime, endTime)

export default cloudWatchService
