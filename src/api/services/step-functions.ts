/**
 * Step Functions Service API
 * Handles all AWS Step Functions operations via the API client
 */

import { api } from '../client'
import type { StepFunctionsStateMachine, StepFunctionsExecution } from '../types/aws'

const TARGET_PREFIX = 'AWSStepFunctions'

// Response type for createStateMachine
interface CreateStateMachineResponse {
  stateMachineArn: string
  stateMachineName: string
  creationDate: string
}

// Response type for listStateMachines
interface ListStateMachinesResponse {
  stateMachines: StepFunctionsStateMachine[]
  nextToken?: string
}

// Response type for describeStateMachine
interface DescribeStateMachineResponse extends StepFunctionsStateMachine {
  definition: string
  roleArn: string
}

// Response type for listExecutions
interface ListExecutionsResponse {
  executions: StepFunctionsExecution[]
  nextToken?: string
}

// Response type for startExecution
interface StartExecutionResponse {
  executionArn: string
  startDate: string
}

// Response type for stopExecution
interface StopExecutionResponse {
  stopDate: string
}

// Response type for updateStateMachine
interface UpdateStateMachineResponse {
  updateDate: string
}

// Response type for describeActivity
interface DescribeActivityResponse {
  activityArn: string
  name: string
  creationDate: string
}

// Response type for listActivities
interface ListActivitiesResponse {
  activities: Array<{
    activityArn: string
    name: string
    creationDate: string
  }>
  nextToken?: string
}

// Execution history event type
interface ExecutionHistoryEvent {
  timestamp: string
  type: string
  id: number
  previousEventId?: number
  executionFailedEventDetails?: {
    error: string
    cause: string
  }
  activityScheduledEventDetails?: {
    resource: string
    input?: string
    timeoutInSeconds?: number
    heartbeatInSeconds?: number
  }
  activityStartedEventDetails?: {
    resource: string
    input?: string
  }
  activitySucceededEventDetails?: {
    output: string
  }
  activityFailedEventDetails?: {
    error: string
    cause: string
  }
  lambdaFunctionScheduledEventDetails?: {
    resource: string
    input?: string
    timeoutInSeconds?: number
  }
  lambdaFunctionStartedEventDetails?: {
    resource: string
  }
  lambdaFunctionSucceededEventDetails?: {
    output: string
  }
  lambdaFunctionFailedEventDetails?: {
    error: string
    cause: string
  }
  lambdaFunctionAbortedEventDetails?: Record<string, unknown>
  taskSubmittedEventDetails?: {
    resource: string
    output: string
  }
  taskStartedEventDetails?: {
    resource: string
  }
  taskSucceededEventDetails?: {
    output: string
  }
  taskFailedEventDetails?: {
    error: string
    cause: string
  }
  taskTimedOutEventDetails?: {
    error: string
    cause: string
    resourceType: string
  }
  passStateEnteredEventDetails?: {
    input: string
    name: string
  }
  passStateExitedEventDetails?: {
    output: string
    name: string
  }
  waitStateEnteredEventDetails?: {
    seconds?: number
    timestamp?: string
  }
  waitStateExitedEventDetails?: {
    durationInSeconds: number
  }
  choiceStateEnteredEventDetails?: {
    input: string
    name: string
  }
  choiceStateExitedEventDetails?: {
    output: string
    name: string
    choiceIndex: number
  }
  succeedStateEnteredEventDetails?: {
    input: string
    output: string
  }
  succeedStateExitedEventDetails?: Record<string, unknown>
  failStateEnteredEventDetails?: {
    error: string
    cause: string
  }
  executionStartedEventDetails?: {
    input: string
    inputDetails?: {
      inlet: string
      resolved: string
    }
    roleArn: string
  }
  executionAbortedEventDetails?: {
    error: string
    cause: string
  }
  executionSucceededEventDetails?: {
    output: string
    outputDetails?: {
      concluded: string
    }
  }
  executionRedrivenEventDetails?: Record<string, unknown>
  executionTimedOutEventDetails?: {
    error: string
    cause: string
  }
  mapStateEnteredEventDetails?: Record<string, unknown>
  mapStateExitedEventDetails?: Record<string, unknown>
  mapIterationStartedEventDetails?: Record<string, unknown>
  mapIterationSucceededEventDetails?: Record<string, unknown>
  mapIterationFailedEventDetails?: Record<string, unknown>
  mapIterationAbortedEventDetails?: Record<string, unknown>
}

// Response type for getExecutionHistory
interface GetExecutionHistoryResponse {
  events: ExecutionHistoryEvent[]
  nextToken?: string
}

/**
 * Create a state machine
 */
export async function createStateMachine(params: {
  name: string
  definition: string
  roleArn: string
  type?: 'STANDARD' | 'EXPRESS'
  loggingConfiguration?: {
    level?: 'ALL' | 'ERROR' | 'FATAL' | 'OFF'
    includeExecutionData?: boolean
    destinations?: Array<{
      cloudWatchLogsLogGroup?: {
        logGroupArn: string
      }
    }>
  }
  tags?: Array<{ key: string; value: string }>
}): Promise<CreateStateMachineResponse> {
  try {
    const response = await api.post<CreateStateMachineResponse>('/states', {
      Action: 'CreateStateMachine',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateStateMachine`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating state machine:', error)
    throw error
  }
}

/**
 * List state machines
 */
export async function listStateMachines(params?: {
  maxResults?: number
  nextToken?: string
}): Promise<ListStateMachinesResponse> {
  try {
    const response = await api.post<ListStateMachinesResponse>('/states', {
      Action: 'ListStateMachines',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListStateMachines`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing state machines:', error)
    throw error
  }
}

/**
 * Describe a state machine
 */
export async function describeStateMachine(stateMachineArn: string): Promise<DescribeStateMachineResponse> {
  try {
    const response = await api.post<DescribeStateMachineResponse>('/states', {
      Action: 'DescribeStateMachine',
      stateMachineArn,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeStateMachine`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing state machine:', error)
    throw error
  }
}

/**
 * Describe a state machine execution
 */
export async function describeExecution(executionArn: string): Promise<StepFunctionsExecution> {
  try {
    const response = await api.post<StepFunctionsExecution>('/states', {
      Action: 'DescribeExecution',
      executionArn,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeExecution`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing execution:', error)
    throw error
  }
}

/**
 * List executions for a state machine
 */
export async function listExecutions(stateMachineArn: string, params?: {
  statusFilter?: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
  maxResults?: number
  nextToken?: string
}): Promise<ListExecutionsResponse> {
  try {
    const response = await api.post<ListExecutionsResponse>('/states', {
      Action: 'ListExecutions',
      stateMachineArn,
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListExecutions`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing executions:', error)
    throw error
  }
}

/**
 * Start a state machine execution
 */
export async function startExecution(params: {
  stateMachineArn: string
  name?: string
  input?: string
}): Promise<StartExecutionResponse> {
  try {
    const response = await api.post<StartExecutionResponse>('/states', {
      Action: 'StartExecution',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.StartExecution`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error starting execution:', error)
    throw error
  }
}

/**
 * Stop an execution
 */
export async function stopExecution(params: {
  executionArn: string
  error?: string
  cause?: string
}): Promise<StopExecutionResponse> {
  try {
    const response = await api.post<StopExecutionResponse>('/states', {
      Action: 'StopExecution',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.StopExecution`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error stopping execution:', error)
    throw error
  }
}

/**
 * Get execution history
 */
export async function getExecutionHistory(params: {
  executionArn: string
  reverseOrder?: boolean
  maxResults?: number
  nextToken?: string
}): Promise<GetExecutionHistoryResponse> {
  try {
    const response = await api.post<GetExecutionHistoryResponse>('/states', {
      Action: 'GetExecutionHistory',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.GetExecutionHistory`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error getting execution history:', error)
    throw error
  }
}

/**
 * Update a state machine
 */
export async function updateStateMachine(params: {
  stateMachineArn: string
  definition?: string
  roleArn?: string
  loggingConfiguration?: {
    level?: 'ALL' | 'ERROR' | 'FATAL' | 'OFF'
    includeExecutionData?: boolean
    destinations?: Array<{
      cloudWatchLogsLogGroup?: {
        logGroupArn: string
      }
    }>
  }
}): Promise<UpdateStateMachineResponse> {
  try {
    const response = await api.post<UpdateStateMachineResponse>('/states', {
      Action: 'UpdateStateMachine',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.UpdateStateMachine`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating state machine:', error)
    throw error
  }
}

/**
 * Delete a state machine
 */
export async function deleteStateMachine(stateMachineArn: string): Promise<void> {
  try {
    await api.post('/states', {
      Action: 'DeleteStateMachine',
      stateMachineArn,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteStateMachine`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting state machine:', error)
    throw error
  }
}

/**
 * Describe an activity
 */
export async function describeActivity(activityArn: string): Promise<DescribeActivityResponse> {
  try {
    const response = await api.post<DescribeActivityResponse>('/states', {
      Action: 'DescribeActivity',
      activityArn,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeActivity`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing activity:', error)
    throw error
  }
}

/**
 * List activities
 */
export async function listActivities(params?: {
  maxResults?: number
  nextToken?: string
}): Promise<ListActivitiesResponse> {
  try {
    const response = await api.post<ListActivitiesResponse>('/states', {
      Action: 'ListActivities',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListActivities`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing activities:', error)
    throw error
  }
}
