/**
 * SNS Service API
 * Handles all AWS Simple Notification Service operations via the API client
 */

import { api, parseXML } from '../client'
import type { SNSTopic, SNSSubscription, SNSPublishRequest, SNSPublishResponse } from '../types/aws'

// Response types for XML parsing
interface ListTopicsResponse {
  ListTopicsResult?: {
    Topic?: Array<{
      TopicArn: string
    }>
    NextToken?: string
  }
}

interface ListSubscriptionsResponse {
  ListSubscriptionsResult?: {
    Subscription?: Array<{
      SubscriptionArn: string
      Owner: string
      Protocol: string
      Endpoint?: string
      TopicArn: string
      ConfirmationWasAuthenticated?: string
    }>
    NextToken?: string
  }
}

interface ListSubscriptionsByTopicResponse {
  ListSubscriptionsByTopicResult?: {
    Subscription?: Array<{
      SubscriptionArn: string
      Owner: string
      Protocol: string
      Endpoint?: string
      TopicArn: string
      ConfirmationWasAuthenticated?: string
    }>
    NextToken?: string
  }
}

interface GetTopicAttributesResponse {
  GetTopicAttributesResult?: {
    Attributes?: {
      Entry?: Array<{
        Key: string
        Value: string
      }>
    }
  }
}

interface CreateTopicResponse {
  CreateTopicResult?: {
    TopicArn: string
  }
}

interface SubscribeResponse {
  SubscribeResult?: {
    SubscriptionArn: string
  }
}

interface PublishResponse {
  PublishResult?: {
    MessageId: string
    SequenceNumber?: string
  }
}

interface ConfirmSubscriptionResponse {
  ConfirmSubscriptionResult?: {
    SubscriptionArn: string
  }
}

interface GetSubscriptionAttributesResponse {
  GetSubscriptionAttributesResult?: {
    Attributes?: {
      Entry?: Array<{
        Key: string
        Value: string
      }>
    }
  }
}

interface ListTagsForResourceResponse {
  ListTagsForResourceResult?: {
    Tags?: {
      Tag?: Array<{
        Key: string
        Value: string
      }>
      Key?: string
      Value?: string
    }
  }
}

/**
 * List all SNS topics
 */
export async function listTopics(): Promise<SNSTopic[]> {
  try {
    const response = await api.get('/sns?Action=ListTopics')

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListTopicsResponse>(xmlData)

    if (!parsed?.ListTopicsResult?.Topic) {
      return []
    }

    const topics = parsed.ListTopicsResult.Topic
    const topicArray = Array.isArray(topics) ? topics : [topics]

    return topicArray.map((topic) => ({
      TopicArn: topic.TopicArn,
      TopicName: topic.TopicArn.split(':').pop() || '',
    }))
  } catch (error) {
    console.error('Error listing topics:', error)
    throw error
  }
}

/**
 * Create a new SNS topic
 */
export async function createTopic(
  name: string,
  options?: {
    displayName?: string
    tags?: Record<string, string>
    fifoTopic?: boolean
  }
): Promise<string> {
  try {
    const params = new URLSearchParams()
    params.append('Name', name)

    if (options?.displayName) {
      params.append('DisplayName', options.displayName)
    }

    if (options?.fifoTopic) {
      params.append('Attributes.entry.1.Key', 'FifoTopic')
      params.append('Attributes.entry.1.Value', 'true')
    }

    const queryParams: string[] = [`Action=CreateTopic`]
    
    if (options?.displayName) {
      queryParams.push(`DisplayName=${encodeURIComponent(options.displayName)}`)
    }

    let attrIndex = 1
    if (options?.fifoTopic) {
      queryParams.push(`Attribute.${attrIndex}.Name=FifoTopic`)
      queryParams.push(`Attribute.${attrIndex}.Value=true`)
      attrIndex++
    }

    // Add tags
    if (options?.tags) {
      let tagIndex = 1
      for (const [key, value] of Object.entries(options.tags)) {
        queryParams.push(`Tags.${tagIndex}.Key=${encodeURIComponent(key)}`)
        queryParams.push(`Tags.${tagIndex}.Value=${encodeURIComponent(value)}`)
        tagIndex++
      }
    }

    const queryString = queryParams.join('&')
    const response = await api.get(`/sns?${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<CreateTopicResponse>(xmlData)

    if (!parsed?.CreateTopicResult?.TopicArn) {
      throw new Error('Failed to create topic: No ARN returned')
    }

    return parsed.CreateTopicResult.TopicArn
  } catch (error) {
    console.error('Error creating topic:', error)
    throw error
  }
}

/**
 * Delete an SNS topic
 */
export async function deleteTopic(topicArn: string): Promise<void> {
  try {
    await api.get(`/sns?Action=DeleteTopic&TopicArn=${encodeURIComponent(topicArn)}`)
  } catch (error) {
    console.error('Error deleting topic:', error)
    throw error
  }
}

/**
 * Get topic attributes
 */
export async function getTopicAttributes(topicArn: string): Promise<Record<string, string>> {
  try {
    const response = await api.get(
      `/sns?Action=GetTopicAttributes&TopicArn=${encodeURIComponent(topicArn)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetTopicAttributesResponse>(xmlData)

    const attributes: Record<string, string> = {}
    if (parsed?.GetTopicAttributesResult?.Attributes?.Entry) {
      const entries = parsed.GetTopicAttributesResult.Attributes.Entry
      const entryArray = Array.isArray(entries) ? entries : [entries]
      entryArray.forEach((entry) => {
        attributes[entry.Key] = entry.Value
      })
    }

    return attributes
  } catch (error) {
    console.error('Error getting topic attributes:', error)
    throw error
  }
}

/**
 * Set topic attributes
 */
export async function setTopicAttributes(
  topicArn: string,
  attributeName: string,
  attributeValue: string
): Promise<void> {
  try {
    await api.get(
      `/sns?Action=SetTopicAttributes&TopicArn=${encodeURIComponent(topicArn)}&AttributeName=${encodeURIComponent(attributeName)}&AttributeValue=${encodeURIComponent(attributeValue)}`
    )
  } catch (error) {
    console.error('Error setting topic attributes:', error)
    throw error
  }
}

/**
 * Subscribe to a topic
 */
export async function subscribe(
  topicArn: string,
  protocol: string,
  endpoint: string
): Promise<string> {
  try {
    const response = await api.get(
      `/sns?Action=Subscribe&TopicArn=${encodeURIComponent(topicArn)}&Protocol=${encodeURIComponent(protocol)}&Endpoint=${encodeURIComponent(endpoint)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<SubscribeResponse>(xmlData)

    return parsed?.SubscribeResult?.SubscriptionArn || ''
  } catch (error) {
    console.error('Error subscribing:', error)
    throw error
  }
}

/**
 * List all subscriptions
 */
export async function listSubscriptions(): Promise<SNSSubscription[]> {
  try {
    const response = await api.get('/sns?Action=ListSubscriptions')

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListSubscriptionsResponse>(xmlData)

    if (!parsed?.ListSubscriptionsResult?.Subscription) {
      return []
    }

    const subscriptions = parsed.ListSubscriptionsResult.Subscription
    const subArray = Array.isArray(subscriptions) ? subscriptions : [subscriptions]

    return subArray.map((sub) => ({
      SubscriptionArn: sub.SubscriptionArn,
      Owner: sub.Owner,
      Protocol: sub.Protocol,
      Endpoint: sub.Endpoint,
      TopicArn: sub.TopicArn,
      ConfirmationWasAuthenticated: sub.ConfirmationWasAuthenticated === 'true',
    }))
  } catch (error) {
    console.error('Error listing subscriptions:', error)
    throw error
  }
}

/**
 * List subscriptions by topic
 */
export async function listSubscriptionsByTopic(topicArn: string): Promise<SNSSubscription[]> {
  try {
    const response = await api.get(
      `/sns?Action=ListSubscriptionsByTopic&TopicArn=${encodeURIComponent(topicArn)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListSubscriptionsByTopicResponse>(xmlData)

    if (!parsed?.ListSubscriptionsByTopicResult?.Subscription) {
      return []
    }

    const subscriptions = parsed.ListSubscriptionsByTopicResult.Subscription
    const subArray = Array.isArray(subscriptions) ? subscriptions : [subscriptions]

    return subArray.map((sub) => ({
      SubscriptionArn: sub.SubscriptionArn,
      Owner: sub.Owner,
      Protocol: sub.Protocol,
      Endpoint: sub.Endpoint,
      TopicArn: sub.TopicArn,
      ConfirmationWasAuthenticated: sub.ConfirmationWasAuthenticated === 'true',
    }))
  } catch (error) {
    console.error('Error listing subscriptions by topic:', error)
    throw error
  }
}

/**
 * Unsubscribe from a topic
 */
export async function unsubscribe(subscriptionArn: string): Promise<void> {
  try {
    await api.get(
      `/sns?Action=Unsubscribe&SubscriptionArn=${encodeURIComponent(subscriptionArn)}`
    )
  } catch (error) {
    console.error('Error unsubscribing:', error)
    throw error
  }
}

/**
 * Publish a message to a topic
 */
export async function publish(
  request: SNSPublishRequest
): Promise<{ MessageId: string }> {
  try {
    const params = new URLSearchParams()
    
    if (request.TopicArn) {
      params.append('TopicArn', request.TopicArn)
    }
    if (request.TargetArn) {
      params.append('TargetArn', request.TargetArn)
    }
    if (request.PhoneNumber) {
      params.append('PhoneNumber', request.PhoneNumber)
    }
    if (request.Subject) {
      params.append('Subject', request.Subject)
    }
    params.append('Message', request.Message)
    if (request.MessageStructure) {
      params.append('MessageStructure', request.MessageStructure)
    }

    if (request.MessageAttributes) {
      let attrIndex = 1
      for (const [key, value] of Object.entries(request.MessageAttributes)) {
        params.append(`MessageAttributes.${attrIndex}.Name`, key)
        params.append(`MessageAttributes.${attrIndex}.Value.DataType`, value.DataType)
        if (value.StringValue) {
          params.append(`MessageAttributes.${attrIndex}.Value.StringValue`, value.StringValue)
        }
        if (value.BinaryValue) {
          params.append(`MessageAttributes.${attrIndex}.Value.BinaryValue`, value.BinaryValue)
        }
        attrIndex++
      }
    }

    const queryString = params.toString().replace(/&/g, '&')
    const response = await api.get(`/sns?Action=Publish&${queryString}`)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<PublishResponse>(xmlData)

    return {
      MessageId: parsed?.PublishResult?.MessageId || '',
    }
  } catch (error) {
    console.error('Error publishing message:', error)
    throw error
  }
}

/**
 * Publish to a topic with JSON payload
 */
export async function publishJSON(
  topicArn: string,
  payload: Record<string, unknown>,
  options?: {
    subject?: string
    messageAttributes?: Record<string, { DataType: string; StringValue?: string }>
  }
): Promise<{ MessageId: string }> {
  return publish({
    TopicArn: topicArn,
    Message: JSON.stringify(payload),
    Subject: options?.subject,
    MessageAttributes: options?.messageAttributes,
  })
}

/**
 * Confirm a subscription
 */
export async function confirmSubscription(
  topicArn: string,
  token: string,
  nonce?: string
): Promise<string> {
  try {
    let url = `/sns?Action=ConfirmSubscription&TopicArn=${encodeURIComponent(topicArn)}&Token=${encodeURIComponent(token)}`
    if (nonce) {
      url += `&AuthenticateOnUnsubscribe=${encodeURIComponent(nonce)}`
    }

    const response = await api.get(url)

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ConfirmSubscriptionResponse>(xmlData)

    return parsed?.ConfirmSubscriptionResult?.SubscriptionArn || ''
  } catch (error) {
    console.error('Error confirming subscription:', error)
    throw error
  }
}

/**
 * Get subscription attributes
 */
export async function getSubscriptionAttributes(
  subscriptionArn: string
): Promise<Record<string, string>> {
  try {
    const response = await api.get(
      `/sns?Action=GetSubscriptionAttributes&SubscriptionArn=${encodeURIComponent(subscriptionArn)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetSubscriptionAttributesResponse>(xmlData)

    const attributes: Record<string, string> = {}
    if (parsed?.GetSubscriptionAttributesResult?.Attributes?.Entry) {
      const entries = parsed.GetSubscriptionAttributesResult.Attributes.Entry
      const entryArray = Array.isArray(entries) ? entries : [entries]
      entryArray.forEach((entry) => {
        attributes[entry.Key] = entry.Value
      })
    }

    return attributes
  } catch (error) {
    console.error('Error getting subscription attributes:', error)
    throw error
  }
}

/**
 * Set subscription attributes
 */
export async function setSubscriptionAttributes(
  subscriptionArn: string,
  attributeName: string,
  attributeValue: string
): Promise<void> {
  try {
    await api.get(
      `/sns?Action=SetSubscriptionAttributes&SubscriptionArn=${encodeURIComponent(subscriptionArn)}&AttributeName=${encodeURIComponent(attributeName)}&AttributeValue=${encodeURIComponent(attributeValue)}`
    )
  } catch (error) {
    console.error('Error setting subscription attributes:', error)
    throw error
  }
}

/**
 * Tag a topic
 */
export async function tagResource(topicArn: string, tags: Record<string, string>): Promise<void> {
  try {
    const params: string[] = [`Action=Tag`]
    params.push(`ResourceArn=${encodeURIComponent(topicArn)}`)

    let tagIndex = 1
    for (const [key, value] of Object.entries(tags)) {
      params.push(`Tags.${tagIndex}.Key=${encodeURIComponent(key)}`)
      params.push(`Tags.${tagIndex}.Value=${encodeURIComponent(value)}`)
      tagIndex++
    }

    const queryString = params.join('&')
    await api.get(`/sns?${queryString}`)
  } catch (error) {
    console.error('Error tagging resource:', error)
    throw error
  }
}

/**
 * Untag a topic
 */
export async function untagResource(topicArn: string, tagKeys: string[]): Promise<void> {
  try {
    const params: string[] = [`Action=UntagResource`]
    params.push(`ResourceArn=${encodeURIComponent(topicArn)}`)

    tagKeys.forEach((key, index) => {
      params.push(`TagKeys.${index + 1}=${encodeURIComponent(key)}`)
    })

    const queryString = params.join('&')
    await api.get(`/sns?${queryString}`)
  } catch (error) {
    console.error('Error untagging resource:', error)
    throw error
  }
}

/**
 * List tags for a topic
 */
export async function listTagsForResource(topicArn: string): Promise<Record<string, string>> {
  try {
    const response = await api.get(
      `/sns?Action=ListTagsForResource&ResourceArn=${encodeURIComponent(topicArn)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListTagsForResourceResponse>(xmlData)

    const tags: Record<string, string> = {}
    if (parsed?.ListTagsForResourceResult?.Tags) {
      const tagsData = parsed.ListTagsForResourceResult.Tags
      if ('Tag' in tagsData) {
        const tagArray = Array.isArray(tagsData.Tag) ? tagsData.Tag : [tagsData.Tag]
        tagArray.forEach((tag) => {
          tags[tag.Key] = tag.Value
        })
      } else if ('Key' in tagsData && 'Value' in tagsData) {
        tags[tagsData.Key as string] = tagsData.Value as string
      }
    }

    return tags
  } catch (error) {
    console.error('Error listing tags:', error)
    throw error
  }
}

/**
 * Get platform application attributes
 */
export async function listEndpointsByPlatformApplication(
  platformApplicationArn: string
): Promise<Array<{ EndpointArn: string; Attributes: Record<string, string> }>> {
  try {
    const response = await api.get(
      `/sns?Action=ListEndpointsByPlatformApplication&PlatformApplicationArn=${encodeURIComponent(platformApplicationArn)}`
    )

    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<{
      ListEndpointsByPlatformApplicationResult?: {
        Endpoint?: Array<{
          EndpointArn: string
          Attributes?: {
            Entry?: Array<{ Key: string; Value: string }>
          }
        }>
      }
    }>(xmlData)

    if (!parsed?.ListEndpointsByPlatformApplicationResult?.Endpoint) {
      return []
    }

    const endpoints = parsed.ListEndpointsByPlatformApplicationResult.Endpoint
    const endpointArray = Array.isArray(endpoints) ? endpoints : [endpoints]

    return endpointArray.map((endpoint) => {
      const attributes: Record<string, string> = {}
      if (endpoint.Attributes?.Entry) {
        const entries = Array.isArray(endpoint.Attributes.Entry)
          ? endpoint.Attributes.Entry
          : [endpoint.Attributes.Entry]
        entries.forEach((entry) => {
          attributes[entry.Key] = entry.Value
        })
      }
      return {
        EndpointArn: endpoint.EndpointArn,
        Attributes: attributes,
      }
    })
  } catch (error) {
    console.error('Error listing endpoints:', error)
    throw error
  }
}
