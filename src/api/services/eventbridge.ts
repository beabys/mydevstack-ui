/**
 * EventBridge Service API
 * Handles all Amazon EventBridge operations via the API client
 */

import { api } from '../client'

const TARGET_PREFIX = 'AmazonEventBridge'

// Response types
interface CreateEventBusResponse {
  Name: string
  Arn: string
  Description?: string
}

interface ListEventBusesResponse {
  EventBuses: Array<{
    Name: string
    Arn: string
    Description?: string
  }>
  NextToken?: string
}

interface DescribeEventBusResponse {
  Name: string
  Arn: string
  Description?: string
}

interface PutRuleResponse {
  RuleArn: string
  RuleName: string
  EventBusName?: string
}

interface ListRulesResponse {
  Rules: Array<{
    Name: string
    Arn: string
    EventBusName?: string
    State?: string
    Description?: string
    ScheduleExpression?: string
    EventPattern?: string
  }>
  NextToken?: string
}

interface DescribeRuleResponse {
  Name: string
  Arn: string
  EventBusName?: string
  State?: string
  Description?: string
  ScheduleExpression?: string
  EventPattern?: string
  RoleArn?: string
}

interface PutTargetsResponse {
  FailedEntryCount: number
  FailedEntries: Array<{
    EntryId: string
    ErrorCode: string
    ErrorMessage: string
  }>
}

interface ListTargetsResponse {
  Targets: Array<{
    Id: string
    Arn: string
    RoleArn?: string
    Input?: string
    InputPath?: string
  }>
  NextToken?: string
}

interface RemoveTargetsResponse {
  FailedEntryCount: number
  FailedEntries: Array<{
    EntryId: string
    ErrorCode: string
    ErrorMessage: string
  }>
}

interface PutEventsResponse {
  FailedEntryCount: number
  Entries: Array<{
    EventId: string
    ErrorCode?: string
    ErrorMessage?: string
  }>
}

interface TestEventPatternResponse {
  Result: boolean
}

/**
 * Create an EventBridge event bus
 */
export async function createEventBus(params: {
  Name: string
  Description?: string
  KmsKeyIdentifier?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<CreateEventBusResponse> {
  try {
    const response = await api.post<CreateEventBusResponse>('/events', {
      Action: 'CreateEventBus',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateEventBus`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating event bus:', error)
    throw error
  }
}

/**
 * List EventBridge event buses
 */
export async function listEventBuses(params?: {
  NamePrefix?: string
  Limit?: number
  NextToken?: string
}): Promise<ListEventBusesResponse> {
  try {
    const response = await api.post<ListEventBusesResponse>('/events', {
      Action: 'ListEventBuses',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListEventBuses`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing event buses:', error)
    throw error
  }
}

/**
 * Describe an EventBridge event bus
 */
export async function describeEventBus(Name: string): Promise<DescribeEventBusResponse> {
  try {
    const response = await api.post<DescribeEventBusResponse>('/events', {
      Action: 'DescribeEventBus',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeEventBus`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing event bus:', error)
    throw error
  }
}

/**
 * Delete an EventBridge event bus
 */
export async function deleteEventBus(Name: string): Promise<void> {
  try {
    await api.post('/events', {
      Action: 'DeleteEventBus',
      Name,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteEventBus`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting event bus:', error)
    throw error
  }
}

/**
 * Create an EventBridge rule
 */
export async function putRule(params: {
  Name: string
  EventBusName?: string
  Description?: string
  EventPattern?: string
  ScheduleExpression?: string
  State?: 'ENABLED' | 'DISABLED'
  RoleArn?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<PutRuleResponse> {
  try {
    const response = await api.post<PutRuleResponse>('/events', {
      Action: 'PutRule',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating rule:', error)
    throw error
  }
}

/**
 * List EventBridge rules
 */
export async function listRules(params?: {
  NamePrefix?: string
  EventBusName?: string
  Limit?: number
  NextToken?: string
}): Promise<ListRulesResponse> {
  try {
    const response = await api.post<ListRulesResponse>('/events', {
      Action: 'ListRules',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListRules`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing rules:', error)
    throw error
  }
}

/**
 * Describe an EventBridge rule
 */
export async function describeRule(Name: string, EventBusName?: string): Promise<DescribeRuleResponse> {
  try {
    const response = await api.post<DescribeRuleResponse>('/events', {
      Action: 'DescribeRule',
      Name,
      EventBusName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error describing rule:', error)
    throw error
  }
}

/**
 * Delete an EventBridge rule
 */
export async function deleteRule(Name: string, EventBusName?: string, Force?: boolean): Promise<void> {
  try {
    await api.post('/events', {
      Action: 'DeleteRule',
      Name,
      EventBusName,
      Force,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting rule:', error)
    throw error
  }
}

/**
 * Disable an EventBridge rule
 */
export async function disableRule(Name: string, EventBusName?: string): Promise<void> {
  try {
    await api.post('/events', {
      Action: 'DisableRule',
      Name,
      EventBusName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DisableRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error disabling rule:', error)
    throw error
  }
}

/**
 * Enable an EventBridge rule
 */
export async function enableRule(Name: string, EventBusName?: string): Promise<void> {
  try {
    await api.post('/events', {
      Action: 'EnableRule',
      Name,
      EventBusName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.EnableRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error enabling rule:', error)
    throw error
  }
}

/**
 * Add targets to an EventBridge rule
 */
export async function putTargets(params: {
  Rule: string
  EventBusName?: string
  Targets: Array<{
    Id: string
    Arn: string
    RoleArn?: string
    Input?: string
    InputPath?: string
    InputTransformer?: {
      InputPathsMap?: Record<string, string>
      InputTemplate: string
    }
    DeadLetterConfig?: {
      Arn: string
    }
    RetryPolicy?: {
      MaximumRetryAttempts: number
      MaximumEventAge: number
    }
  }>
}): Promise<PutTargetsResponse> {
  try {
    const response = await api.post<PutTargetsResponse>('/events', {
      Action: 'PutTargets',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutTargets`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting targets:', error)
    throw error
  }
}

/**
 * List targets for an EventBridge rule
 */
export async function listTargets(EventBusName: string, RuleName: string): Promise<ListTargetsResponse> {
  try {
    const response = await api.post<ListTargetsResponse>('/events', {
      Action: 'ListTargetsByRule',
      EventBusName,
      Rule: RuleName,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListTargetsByRule`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error listing targets:', error)
    throw error
  }
}

/**
 * Remove targets from an EventBridge rule
 */
export async function removeTargets(params: {
  Rule: string
  EventBusName?: string
  Ids: string[]
  Force?: boolean
}): Promise<RemoveTargetsResponse> {
  try {
    const response = await api.post<RemoveTargetsResponse>('/events', {
      Action: 'RemoveTargets',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.RemoveTargets`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error removing targets:', error)
    throw error
  }
}

/**
 * Put events to EventBridge
 */
export async function putEvents(entries: Array<{
  Time?: string
  Source?: string
  Resources?: string[]
  DetailType?: string
  Detail?: string
  EventBusName?: string
}>): Promise<PutEventsResponse> {
  try {
    const response = await api.post<PutEventsResponse>('/events', {
      Action: 'PutEvents',
      Entries: entries,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.PutEvents`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error putting events:', error)
    throw error
  }
}

/**
 * Test an event pattern
 */
export async function testEventPattern(eventPattern: string, event: Record<string, unknown>): Promise<TestEventPatternResponse> {
  try {
    const response = await api.post<TestEventPatternResponse>('/events', {
      Action: 'TestEventPattern',
      EventPattern: eventPattern,
      Event: event,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.TestEventPattern`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error testing event pattern:', error)
    throw error
  }
}
