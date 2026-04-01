/**
 * API Services - Barrel Export
 * Re-exports all AWS service API clients for convenient imports
 * @module api/services
 */

// S3 Service (class-based)
export {
  s3Service,
  listBuckets,
  createBucket,
  deleteBucket,
  headBucket,
  listObjects,
  listObjectsV2,
  putObject,
  getObject,
  headObject,
  deleteObject,
  deleteObjects,
  S3Service,
} from './s3'

// Lambda Service (class-based)
export {
  lambdaService,
  listFunctions,
  createFunction,
  getFunction,
  getFunctionConfiguration,
  deleteFunction,
  updateFunctionCode,
  invoke,
  getEventSourceMapping,
  listEventSourceMappings,
  createEventSourceMapping,
  LambdaService,
} from './lambda'

// DynamoDB Service (class-based)
export {
  dynamodbService,
  createTable,
  deleteTable,
  describeTable,
  listTables,
  updateTable,
  putItem,
  getItem,
  deleteItem,
  updateItem,
  query,
  scan,
  batchWriteItem,
  batchGetItem,
  transactWriteItems,
  transactGetItems,
  DynamoDBService,
} from './dynamodb'

// SQS Service (functional)
export {
  listQueues,
  getQueueUrl,
  getQueueAttributes,
  createQueue,
  deleteQueue,
  sendMessage,
  receiveMessages,
  deleteMessage,
  deleteMessages,
  purgeQueue,
  listDeadLetterSourceQueues,
  setQueueAttributes,
  addPermission,
  removePermission,
  tagQueue,
  untagQueue,
  listQueueTags,
} from './sqs'

// SNS Service (functional)
export {
  listTopics,
  createTopic,
  deleteTopic,
  getTopicAttributes,
  setTopicAttributes,
  subscribe,
  listSubscriptions,
  listSubscriptionsByTopic,
  unsubscribe,
  publish,
  publishJSON,
  confirmSubscription,
  getSubscriptionAttributes,
  setSubscriptionAttributes,
  tagResource,
  untagResource,
  listTagsForResource,
  listEndpointsByPlatformApplication,
} from './sns'

// IAM Service
export {
  createUser,
  getUser,
  listUsers,
  deleteUser,
  createRole,
  getRole,
  listRoles,
  deleteRole,
  listPolicies,
  getPolicy,
  createAccessKey,
  listAccessKeys,
  attachRolePolicy,
  detachRolePolicy,
  listAttachedRolePolicies,
} from './iam'

// KMS Service
export {
  createKey,
  describeKey,
  listKeys,
  encrypt,
  decrypt,
  generateDataKey,
  generateDataKeyWithoutPlaintext,
  sign,
  verify,
  enableKey,
  disableKey,
  scheduleKeyDeletion,
  cancelKeyDeletion,
  getKeyRotationStatus,
  enableKeyRotation,
  disableKeyRotation,
} from './kms'

// Secrets Manager Service
export {
  createSecret,
  getSecretValue,
  listSecrets,
  putSecretValue,
  deleteSecret,
  updateSecret,
  describeSecret,
  rotateSecret,
  getRandomPassword,
  tagSecret,
  untagSecret,
  restoreSecret,
} from './secrets-manager'

// EventBridge Service
export {
  createEventBus,
  listEventBuses,
  describeEventBus,
  deleteEventBus,
  putRule,
  listRules,
  describeRule,
  deleteRule,
  disableRule,
  enableRule,
  putTargets,
  listTargets,
  removeTargets,
  putEvents,
  testEventPattern,
} from './eventbridge'

// CloudWatch Service
export {
  createLogGroup,
  describeLogGroups,
  deleteLogGroup,
  createLogStream,
  describeLogStreams,
  deleteLogStream,
  putLogEvents,
  getLogEvents,
  putMetricData,
  getMetricData,
  getMetricStatistics,
  listMetrics,
  putDashboard,
  getDashboard,
  listDashboards,
  deleteDashboard,
} from './cloudwatch'

// Step Functions Service
export {
  createStateMachine,
  listStateMachines,
  describeStateMachine,
  describeExecution,
  listExecutions,
  startExecution,
  stopExecution,
  getExecutionHistory,
  updateStateMachine,
  deleteStateMachine,
  describeActivity,
  listActivities,
} from './step-functions'

// Cognito Service
export {
  createUserPool,
  listUserPools,
  describeUserPool,
  deleteUserPool,
  updateUserPool,
  adminCreateUser,
  adminListUsers,
  adminGetUser,
  adminDeleteUser,
  adminDisableUser,
  adminEnableUser,
  createUserPoolClient,
  listUserPoolClients,
  describeUserPoolClient,
} from './cognito'

// API Gateway Service
export {
  createRestApi,
  getRestApis,
  getRestApi,
  updateRestApi,
  deleteRestApi,
  createResource,
  getResources,
  deleteResource,
  createMethod,
  getMethod,
  deleteMethod,
  createDeployment,
  getDeployments,
  createStage,
  getStages,
  createHttpApi,
  getHttpApis,
  getHttpApi,
  deleteHttpApi,
  createRoute,
  getRoutes,
  deleteRoute,
  createIntegration,
  getIntegrations,
  deleteIntegration,
  createHttpApiStage,
  getHttpApiStages,
} from './api-gateway'

// Kinesis Service
export {
  createStream,
  listStreams,
  describeStream,
  describeStreamSummary,
  deleteStream,
  putRecord,
  putRecords,
  getRecords,
  getShardIterator,
  listShards,
  registerStreamConsumer,
  listStreamConsumers,
  describeStreamConsumer,
  deregisterStreamConsumer,
  splitShard,
  mergeShards,
  updateShardCount,
} from './kinesis'

// CloudFormation Service
export {
  createStack,
  deleteStack,
  listStacks,
  describeStacks,
  describeStackResources,
  updateStack,
  cancelUpdateStack,
  describeStackEvents,
  describeStackResource,
  estimateTemplateCost,
  validateTemplate,
  getTemplate,
  getTemplateSummary,
  describeChangeSet,
  createChangeSet,
  listChangeSets,
  deleteChangeSet,
  executeChangeSet,
} from './cloudformation'

// SSM Parameter Store Service
export {
  putParameter,
  getParameter,
  getParameters,
  getParametersByPath,
  deleteParameter,
  deleteParameters,
  describeParameters,
  getParameterHistory,
  addTagsToResource,
  removeTagsFromResource,
  labelParameterVersion,
  getParameterPolicy,
  putParameterPolicy,
  deleteParameterPolicy,
  listParameterPolicies,
} from './ssm'

// Re-export APIError for convenience
export { APIError } from '../client'

// Re-export parseXML for convenience
export { parseXML } from '../client'
