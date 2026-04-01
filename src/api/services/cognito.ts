/**
 * Cognito Service API
 * Handles all Amazon Cognito Identity Provider operations via the API client
 */

import { api } from '../client'
import type { CognitoUserPool, CognitoUser, CognitoIdentityPool } from '../types/aws'

const TARGET_PREFIX = 'AWSCognitoIdentityProviderService'

// Response type interfaces
interface CreateUserPoolResponse {
  UserPool: CognitoUserPool
}

interface ListUserPoolsResponse {
  UserPools: CognitoUserPool[]
  NextToken?: string
}

interface DescribeUserPoolResponse {
  UserPool: CognitoUserPool
}

interface AdminCreateUserResponse {
  User: CognitoUser
}

interface AdminListUsersResponse {
  Users: CognitoUser[]
  PaginationToken?: string
}

interface AdminGetUserResponse {
  Username: string
  UserAttributes: Array<{ Name: string; Value: string }>
  UserStatus: 'UNCONFIRMED' | 'CONFIRMED' | 'ARCHIVED' | 'COMPROMISED' | 'UNKNOWN' | 'RESET_REQUIRED' | 'FORCE_CHANGE_PASSWORD'
  UserCreateDate: string
  UserLastModifiedDate: string
  Enabled: boolean
  AttributesVerify?: Array<{ Name: string; Value: string; CodeDeliveryDetails?: { Destination: string; DeliveryMedium: string; AttributeName: string } }>
}

interface CreateUserPoolClientResponse {
  UserPoolClient: {
    UserPoolId: string
    ClientName: string
    ClientId: string
    ClientSecret?: string
    LastModifiedDate: string
    CreationDate: string
  }
}

interface ListUserPoolClientsResponse {
  UserPoolClients: Array<{
    ClientId: string
    UserPoolId: string
    ClientName: string
  }>
  NextToken?: string
}

interface DescribeUserPoolClientResponse {
  UserPoolClient: {
    UserPoolId: string
    ClientName: string
    ClientId: string
    ClientSecret?: string
    LastModifiedDate: string
    CreationDate: string
    RefreshTokenValidity?: number
    ReadAttributes?: string[]
    WriteAttributes?: string[]
    ExplicitAuthFlows?: string[]
    SupportedIdentityProviders?: string[]
    CallbackURLs?: string[]
    LogoutURLs?: string[]
    AllowedOAuthFlows?: string[]
    AllowedOAuthScopes?: string[]
  }
}

/**
 * Create a Cognito user pool
 */
export async function createUserPool(params: {
  PoolName: string
  Policies?: {
    PasswordPolicy?: {
      MinimumLength?: number
      RequireUppercase?: boolean
      RequireLowercase?: boolean
      RequireNumbers?: boolean
      RequireSymbols?: boolean
      TemporaryPasswordValidityDays?: number
    }
  }
  LambdaConfig?: {
    PreSignUp?: string
    CustomMessage?: string
    PostConfirmation?: string
    PreAuthentication?: string
    PostAuthentication?: string
    DefineAuthChallenge?: string
    CreateAuthChallenge?: string
    VerifyAuthChallengeResponse?: string
    PreTokenGeneration?: string
    UserMigration?: string
  }
  AutoVerifiedAttributes?: string[]
  AliasAttributes?: string[]
  UsernameAttributes?: string[]
  SmsVerificationMessage?: string
  EmailVerificationMessage?: string
  EmailVerificationSubject?: string
  VerificationMessageTemplate?: {
    SmsMessage?: string
    EmailMessage?: string
    EmailSubject?: string
    EmailMessageByLink?: string
    EmailSubjectByLink?: string
    DefaultEmailOption?: string
  }
  SmsAuthenticationMessage?: string
  MfaConfiguration?: 'OFF' | 'ON' | 'OPTIONAL'
  DeviceConfiguration?: {
    ChallengeRequiredOnNewDevice?: boolean
    DeviceOnlyRememberedOnUserPrompt?: boolean
  }
  EmailConfiguration?: {
    EmailSenderId?: string
    SourceArn?: string
    ReplyToEmailAddress?: string
  }
  SmsConfiguration?: {
    SnsCallerArn: string
    ExternalId?: string
  }
  UserPoolTags?: Record<string, string>
  AdminCreateUserConfig?: {
    AllowAdminCreateUserOnly?: boolean
    UnusedAccountValidityDays?: number
    TempPasswordValidityDays?: number
    InviteMessageTemplate?: {
      SMSMessage?: string
      EmailMessage?: string
      EmailSubject?: string
    }
  }
  Schema?: Array<{
    Name: string
    AttributeDataType: 'String' | 'Number' | 'DateTime' | 'Boolean'
    DeveloperOnlyAttribute?: boolean
    Mutable?: boolean
    Required?: boolean
    NumberAttributeConstraints?: {
      MinValue?: string
      MaxValue?: string
    }
    StringAttributeConstraints?: {
      MinLength?: string
      MaxLength?: string
    }
  }>
  UsernameConfiguration?: {
    CaseSensitive?: boolean
  }
  AccountRecoverySetting?: {
    RecoveryMechanisms?: Array<{
      Priority: number
      Name: 'verified_email' | 'verified_phone_number' | 'confirmed' | 'unknown'
    }>
  }
}): Promise<CreateUserPoolResponse> {
  try {
    const response = await api.post<CreateUserPoolResponse>('/', {
      Action: 'CreateUserPool',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateUserPool`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as CreateUserPoolResponse
  } catch (error) {
    console.error('Error creating user pool:', error)
    throw error
  }
}

/**
 * List Cognito user pools
 */
export async function listUserPools(params?: {
  MaxResults?: number
  NextToken?: string
}): Promise<ListUserPoolsResponse> {
  try {
    const response = await api.post<ListUserPoolsResponse>('/', {
      Action: 'ListUserPools',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListUserPools`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as ListUserPoolsResponse
  } catch (error) {
    console.error('Error listing user pools:', error)
    throw error
  }
}

/**
 * Describe a Cognito user pool
 */
export async function describeUserPool(UserPoolId: string): Promise<DescribeUserPoolResponse> {
  try {
    const response = await api.post<DescribeUserPoolResponse>('/', {
      Action: 'DescribeUserPool',
      UserPoolId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeUserPool`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as DescribeUserPoolResponse
  } catch (error) {
    console.error('Error describing user pool:', error)
    throw error
  }
}

/**
 * Delete a Cognito user pool
 */
export async function deleteUserPool(UserPoolId: string): Promise<void> {
  try {
    await api.post('/', {
      Action: 'DeleteUserPool',
      UserPoolId,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DeleteUserPool`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting user pool:', error)
    throw error
  }
}

/**
 * Update a Cognito user pool
 */
export async function updateUserPool(params: {
  UserPoolId: string
  Policies?: {
    PasswordPolicy?: {
      MinimumLength?: number
      RequireUppercase?: boolean
      RequireLowercase?: boolean
      RequireNumbers?: boolean
      RequireSymbols?: boolean
      TemporaryPasswordValidityDays?: number
    }
  }
  LambdaConfig?: Record<string, string>
  AutoVerifiedAttributes?: string[]
  SmsVerificationMessage?: string
  EmailVerificationMessage?: string
  EmailVerificationSubject?: string
  VerificationMessageTemplate?: Record<string, unknown>
  SmsAuthenticationMessage?: string
  MfaConfiguration?: 'OFF' | 'ON' | 'OPTIONAL'
  DeviceConfiguration?: Record<string, boolean>
  EmailConfiguration?: Record<string, string>
  SmsConfiguration?: Record<string, string>
  UserPoolTags?: Record<string, string>
  AdminCreateUserConfig?: Record<string, unknown>
  UsernameConfiguration?: {
    CaseSensitive?: boolean
  }
  AccountRecoverySetting?: {
    RecoveryMechanisms?: Array<{
      Priority: number
      Name: 'verified_email' | 'verified_phone_number' | 'confirmed' | 'unknown'
    }>
  }
}): Promise<void> {
  try {
    await api.post('/', {
      Action: 'UpdateUserPool',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.UpdateUserPool`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error updating user pool:', error)
    throw error
  }
}

/**
 * Admin create a user
 */
export async function adminCreateUser(params: {
  UserPoolId: string
  Username: string
  UserAttributes?: Array<{ Name: string; Value: string }>
  ValidationData?: Array<{ Name: string; Value: string }>
  TemporaryPassword?: string
  MessageAction?: 'SUPPRESS' | 'RESEND'
  DesiredDeliveryMediums?: string[]
  ForceAliasCreation?: boolean
  ClientMetadata?: Record<string, string>
}): Promise<AdminCreateUserResponse> {
  try {
    const response = await api.post<AdminCreateUserResponse>('/', {
      Action: 'AdminCreateUser',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminCreateUser`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as AdminCreateUserResponse
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Admin list users
 */
export async function adminListUsers(params: {
  UserPoolId: string
  Filter?: string
  AttributesToGet?: string[]
  Limit?: number
  PaginationToken?: string
}): Promise<AdminListUsersResponse> {
  try {
    const response = await api.post<AdminListUsersResponse>('/', {
      Action: 'AdminListUsers',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminListUsers`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as AdminListUsersResponse
  } catch (error) {
    console.error('Error listing users:', error)
    throw error
  }
}

/**
 * Admin get user
 */
export async function adminGetUser(params: {
  UserPoolId: string
  Username: string
}): Promise<AdminGetUserResponse> {
  try {
    const response = await api.post<AdminGetUserResponse>('/', {
      Action: 'AdminGetUser',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminGetUser`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as AdminGetUserResponse
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

/**
 * Admin delete user
 */
export async function adminDeleteUser(params: {
  UserPoolId: string
  Username: string
}): Promise<void> {
  try {
    await api.post('/', {
      Action: 'AdminDeleteUser',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminDeleteUser`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Admin disable user
 */
export async function adminDisableUser(params: {
  UserPoolId: string
  Username: string
}): Promise<void> {
  try {
    await api.post('/', {
      Action: 'AdminDisableUser',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminDisableUser`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error disabling user:', error)
    throw error
  }
}

/**
 * Admin enable user
 */
export async function adminEnableUser(params: {
  UserPoolId: string
  Username: string
}): Promise<void> {
  try {
    await api.post('/', {
      Action: 'AdminEnableUser',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminEnableUser`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error enabling user:', error)
    throw error
  }
}

/**
 * Admin update user attributes
 */
export async function adminUpdateUserAttributes(params: {
  UserPoolId: string
  Username: string
  UserAttributes: Array<{ Name: string; Value: string }>
}): Promise<void> {
  try {
    await api.post('/', {
      Action: 'AdminUpdateUserAttributes',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.AdminUpdateUserAttributes`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
  } catch (error) {
    console.error('Error updating user attributes:', error)
    throw error
  }
}

/**
 * Create user pool client
 */
export async function createUserPoolClient(params: {
  UserPoolId: string
  ClientName: string
  GenerateSecret?: boolean
  RefreshTokenValidity?: number
  ReadAttributes?: string[]
  WriteAttributes?: string[]
  ExplicitAuthFlows?: string[]
  SupportedIdentityProviders?: string[]
  CallbackURLs?: string[]
  LogoutURLs?: string[]
  DefaultRedirectURI?: string
  AllowedOAuthFlows?: string[]
  AllowedOAuthScopes?: string[]
  AllowedOAuthFlowsUserPoolClient?: boolean
  AnalyticsConfiguration?: {
    ApplicationId: string
    ApplicationSdkType: 'AWS' | 'Android' | 'iOS' | 'Web'
    RoleArn: string
    ExternalId?: string
    UserDataAccess?: string
  }
}): Promise<CreateUserPoolClientResponse> {
  try {
    const response = await api.post<CreateUserPoolClientResponse>('/', {
      Action: 'CreateUserPoolClient',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.CreateUserPoolClient`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as CreateUserPoolClientResponse
  } catch (error) {
    console.error('Error creating user pool client:', error)
    throw error
  }
}

/**
 * List user pool clients
 */
export async function listUserPoolClients(params: {
  UserPoolId: string
  MaxResults?: number
  NextToken?: string
}): Promise<ListUserPoolClientsResponse> {
  try {
    const response = await api.post<ListUserPoolClientsResponse>('/', {
      Action: 'ListUserPoolClients',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.ListUserPoolClients`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as ListUserPoolClientsResponse
  } catch (error) {
    console.error('Error listing user pool clients:', error)
    throw error
  }
}

/**
 * Describe user pool client
 */
export async function describeUserPoolClient(params: {
  UserPoolId: string
  ClientId: string
}): Promise<DescribeUserPoolClientResponse> {
  try {
    const response = await api.post<DescribeUserPoolClientResponse>('/', {
      Action: 'DescribeUserPoolClient',
      ...params,
    }, {
      headers: {
        'X-Amz-Target': `${TARGET_PREFIX}.DescribeUserPoolClient`,
        'Content-Type': 'application/x-amz-json-1.1',
      },
    })
    return response.data as DescribeUserPoolClientResponse
  } catch (error) {
    console.error('Error describing user pool client:', error)
    throw error
  }
}
