/**
 * IAM Service API
 * Handles all AWS Identity and Access Management operations via the API client
 */

import { api, parseXML } from '../client'
import type { IAMUser, IAMRole, IAMPolicy, IAMGroup } from '../types/aws'

// Response types for API calls
interface GetPolicyResponse {
  Policy: {
    PolicyName: string
    PolicyId: string
    Arn: string
    Path: string
    DefaultVersionId: string
    AttachmentCount: number
    PermissionsBoundaryUsageCount: number
    IsAttachable: boolean
    Description?: string
    CreateDate: string
    UpdateDate: string
  }
}

interface CreateAccessKeyResponse {
  AccessKey: {
    AccessKeyId: string
    SecretAccessKey: string
    Status: 'Active' | 'Inactive'
    UserName: string
    CreateDate: string
  }
}

interface ListAccessKeysResponse {
  AccessKeyMetadata: Array<{
    AccessKeyId: string
    Status: 'Active' | 'Inactive'
    CreateDate: string
    UserName?: string
  }>
}

interface ListAttachedRolePoliciesResponse {
  AttachedPolicies: Array<{
    PolicyName: string
    PolicyArn: string
  }>
}

interface ListUserPoliciesResponse {
  PolicyNames: string[]
}

interface ListRolePoliciesResponse {
  PolicyNames: string[]
}

interface GetRolePolicyResponse {
  PolicyName: string
  PolicyDocument: string
  RoleName: string
}

// Response types for XML parsing
interface ListUsersResponse {
  ListUsersResult?: {
    Users?: {
      User: IAMUser[]
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface ListRolesResponse {
  ListRolesResult?: {
    Roles?: {
      Role: IAMRole[]
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface GetUserResponse {
  GetUserResult?: {
    User: IAMUser
  }
}

interface GetRoleResponse {
  GetRoleResult?: {
    Role: IAMRole
  }
}

interface ListPoliciesResponse {
  ListPoliciesResult?: {
    Policies?: {
      Policy: IAMPolicy[]
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface CreateUserResponse {
  CreateUserResult?: {
    User: IAMUser
  }
}

interface CreateRoleResponse {
  CreateRoleResult?: {
    Role: IAMRole
  }
}

interface ListAccessKeysXMLResponse {
  ListAccessKeysResult?: {
    AccessKeys?: {
      AccessKey: Array<{
        AccessKeyId: string
        SecretAccessKey?: string
        Status: 'Active' | 'Inactive'
        CreateDate: string
        UserName?: string
      }>
    }
  }
}

interface ListAttachedRolePoliciesXMLResponse {
  ListAttachedRolePoliciesResult?: {
    AttachedPolicies?: {
      Policy: Array<{
        PolicyName: string
        PolicyArn: string
      }>
    }
  }
}

// Group response types
interface ListGroupsResponse {
  ListGroupsResult?: {
    Groups?: {
      Group: IAMGroup[]
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface CreateGroupResponse {
  CreateGroupResult?: {
    Group: IAMGroup
  }
}

interface GetGroupResponse {
  GetGroupResult?: {
    Group: IAMGroup
    Users?: {
      User: Array<{
        UserName: string
        UserId: string
        Arn: string
        CreateDate: string
        Path: string
      }>
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface ListGroupsForUserResponse {
  ListGroupsForUserResult?: {
    Groups?: {
      Group: IAMGroup[]
    }
    IsTruncated: boolean
    Marker?: string
  }
}

interface ListUsersForGroupResponse {
  ListUsersForGroupResult?: {
    Users?: {
      User: Array<{
        UserName: string
        UserId: string
        Arn: string
        CreateDate: string
        Path: string
      }>
    }
    IsTruncated: boolean
    Marker?: string
  }
}

/**
 * Create a new IAM user
 */
export async function createUser(params: {
  UserName: string
  Path?: string
  PermissionsBoundary?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<IAMUser> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'CreateUser',
      UserName: params.UserName,
    })
    
    if (params.Path) {
      queryParams.append('Path', params.Path)
    }
    
    if (params.PermissionsBoundary) {
      queryParams.append('PermissionsBoundary', params.PermissionsBoundary)
    }
    
    if (params.Tags) {
      params.Tags.forEach((tag, index) => {
        queryParams.append(`Tags.member.${index + 1}.Key`, tag.Key)
        queryParams.append(`Tags.member.${index + 1}.Value`, tag.Value)
      })
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<CreateUserResponse>(xmlData)
    
    if (!parsed?.CreateUserResult?.User) {
      throw new Error('Failed to parse CreateUser response')
    }
    
    return parsed.CreateUserResult.User
  } catch (error) {
    console.error('Error creating IAM user:', error)
    throw error
  }
}

/**
 * Get IAM user details
 */
export async function getUser(UserName?: string): Promise<IAMUser> {
  try {
    const queryParams = new URLSearchParams({ Action: 'GetUser' })
    if (UserName) {
      queryParams.append('UserName', UserName)
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetUserResponse>(xmlData)
    
    if (!parsed?.GetUserResult?.User) {
      throw new Error('Failed to parse GetUser response')
    }
    
    return parsed.GetUserResult.User
  } catch (error) {
    console.error('Error getting IAM user:', error)
    throw error
  }
}

/**
 * List all IAM users
 */
export async function listUsers(): Promise<{
  Users: IAMUser[]
  IsTruncated: boolean
  Marker?: string
}> {
  try {
    const queryParams = new URLSearchParams({ Action: 'ListUsers' })
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListUsersResponse>(xmlData)
    
    const users = parsed?.ListUsersResult?.Users?.User || []
    return {
      Users: Array.isArray(users) ? users : [users],
      IsTruncated: parsed?.ListUsersResult?.IsTruncated || false,
      Marker: parsed?.ListUsersResult?.Marker,
    }
  } catch (error) {
    console.error('Error listing IAM users:', error)
    throw error
  }
}

/**
 * Delete an IAM user
 */
export async function deleteUser(UserName: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'DeleteUser',
      UserName,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error deleting IAM user:', error)
    throw error
  }
}

/**
 * Create a new IAM role
 */
export async function createRole(params: {
  RoleName: string
  AssumeRolePolicyDocument: string
  Description?: string
  MaxSessionDuration?: number
  PermissionsBoundary?: string
  Tags?: Array<{ Key: string; Value: string }>
}): Promise<IAMRole> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'CreateRole',
      RoleName: params.RoleName,
      AssumeRolePolicyDocument: encodeURIComponent(params.AssumeRolePolicyDocument),
    })
    
    if (params.Description) {
      queryParams.append('Description', params.Description)
    }
    
    if (params.MaxSessionDuration) {
      queryParams.append('MaxSessionDuration', params.MaxSessionDuration.toString())
    }
    
    if (params.PermissionsBoundary) {
      queryParams.append('PermissionsBoundary', params.PermissionsBoundary)
    }
    
    if (params.Tags) {
      params.Tags.forEach((tag, index) => {
        queryParams.append(`Tags.member.${index + 1}.Key`, tag.Key)
        queryParams.append(`Tags.member.${index + 1}.Value`, tag.Value)
      })
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<CreateRoleResponse>(xmlData)
    
    if (!parsed?.CreateRoleResult?.Role) {
      throw new Error('Failed to parse CreateRole response')
    }
    
    return parsed.CreateRoleResult.Role
  } catch (error) {
    console.error('Error creating IAM role:', error)
    throw error
  }
}

/**
 * Get IAM role details
 */
export async function getRole(RoleName: string): Promise<IAMRole> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'GetRole',
      RoleName,
    })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetRoleResponse>(xmlData)
    
    if (!parsed?.GetRoleResult?.Role) {
      throw new Error('Failed to parse GetRole response')
    }
    
    return parsed.GetRoleResult.Role
  } catch (error) {
    console.error('Error getting IAM role:', error)
    throw error
  }
}

/**
 * List all IAM roles
 */
export async function listRoles(): Promise<{
  Roles: IAMRole[]
  IsTruncated: boolean
  Marker?: string
}> {
  try {
    const queryParams = new URLSearchParams({ Action: 'ListRoles' })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListRolesResponse>(xmlData)
    
    const roles = parsed?.ListRolesResult?.Roles?.Role || []
    return {
      Roles: Array.isArray(roles) ? roles : [roles],
      IsTruncated: parsed?.ListRolesResult?.IsTruncated || false,
      Marker: parsed?.ListRolesResult?.Marker,
    }
  } catch (error) {
    console.error('Error listing IAM roles:', error)
    throw error
  }
}

/**
 * Delete an IAM role
 */
export async function deleteRole(RoleName: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'DeleteRole',
      RoleName,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error deleting IAM role:', error)
    throw error
  }
}

/**
 * List IAM policies
 */
export async function listPolicies(Scope?: 'All' | 'AWS' | 'Local', OnlyAttached?: boolean): Promise<{
  Policies: IAMPolicy[]
  IsTruncated: boolean
  Marker?: string
}> {
  try {
    const queryParams = new URLSearchParams({ Action: 'ListPolicies' })
    
    if (Scope) {
      queryParams.append('Scope', Scope)
    }
    
    if (OnlyAttached !== undefined) {
      queryParams.append('OnlyAttached', OnlyAttached.toString())
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListPoliciesResponse>(xmlData)
    
    const policies = parsed?.ListPoliciesResult?.Policies?.Policy || []
    return {
      Policies: Array.isArray(policies) ? policies : [policies],
      IsTruncated: parsed?.ListPoliciesResult?.IsTruncated || false,
      Marker: parsed?.ListPoliciesResult?.Marker,
    }
  } catch (error) {
    console.error('Error listing IAM policies:', error)
    throw error
  }
}

/**
 * Get a policy
 */
export async function getPolicy(PolicyArn: string): Promise<GetPolicyResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'GetPolicy',
      PolicyArn,
    })
    
    const response = await api.get<GetPolicyResponse>(`/iam?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error getting IAM policy:', error)
    throw error
  }
}

/**
 * Create an access key for a user
 */
export async function createAccessKey(UserName: string): Promise<CreateAccessKeyResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'CreateAccessKey',
      UserName,
    })
    
    const response = await api.get<CreateAccessKeyResponse>(`/iam?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error creating access key:', error)
    throw error
  }
}

/**
 * List access keys for a user
 */
export async function listAccessKeys(UserName?: string): Promise<ListAccessKeysResponse> {
  try {
    const queryParams = new URLSearchParams({ Action: 'ListAccessKeys' })
    if (UserName) {
      queryParams.append('UserName', UserName)
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListAccessKeysXMLResponse>(xmlData)
    
    const keys = parsed?.ListAccessKeysResult?.AccessKeys?.AccessKey || []
    return {
      AccessKeyMetadata: Array.isArray(keys) ? keys : [keys],
    }
  } catch (error) {
    console.error('Error listing access keys:', error)
    throw error
  }
}

/**
 * Attach a policy to a role
 */
export async function attachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'AttachRolePolicy',
      RoleName,
      PolicyArn,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error attaching policy to role:', error)
    throw error
  }
}

/**
 * Detach a policy from a role
 */
export async function detachRolePolicy(RoleName: string, PolicyArn: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'DetachRolePolicy',
      RoleName,
      PolicyArn,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error detaching policy from role:', error)
    throw error
  }
}

/**
 * List attached role policies
 */
export async function listAttachedRolePolicies(RoleName: string): Promise<ListAttachedRolePoliciesResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'ListAttachedRolePolicies',
      RoleName,
    })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListAttachedRolePoliciesXMLResponse>(xmlData)
    
    const policies = parsed?.ListAttachedRolePoliciesResult?.AttachedPolicies?.Policy || []
    return {
      AttachedPolicies: Array.isArray(policies) ? policies : [policies],
    }
  } catch (error) {
    console.error('Error listing attached role policies:', error)
    throw error
  }
}

// Group functions
export async function createGroup(GroupName: string, Path?: string): Promise<IAMGroup> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'CreateGroup',
      GroupName,
    })
    
    if (Path) {
      queryParams.append('Path', Path)
    }
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<CreateGroupResponse>(xmlData)
    
    if (!parsed?.CreateGroupResult?.Group) {
      throw new Error('Failed to parse CreateGroup response')
    }
    
    return parsed.CreateGroupResult.Group
  } catch (error) {
    console.error('Error creating IAM group:', error)
    throw error
  }
}

export async function getGroup(GroupName: string): Promise<{
  Group: IAMGroup
  Users?: IAMUser[]
  IsTruncated: boolean
}> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'GetGroup',
      GroupName,
    })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<GetGroupResponse>(xmlData)
    
    if (!parsed?.GetGroupResult?.Group) {
      throw new Error('Failed to parse GetGroup response')
    }
    
    const users = parsed?.GetGroupResult?.Users?.User || []
    return {
      Group: parsed.GetGroupResult.Group,
      Users: Array.isArray(users) ? users : [users],
      IsTruncated: parsed.GetGroupResult.IsTruncated || false,
    }
  } catch (error) {
    console.error('Error getting IAM group:', error)
    throw error
  }
}

export async function listGroups(): Promise<{
  Groups: IAMGroup[]
  IsTruncated: boolean
}> {
  try {
    const queryParams = new URLSearchParams({ Action: 'ListGroups' })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListGroupsResponse>(xmlData)
    
    const groups = parsed?.ListGroupsResult?.Groups?.Group || []
    return {
      Groups: Array.isArray(groups) ? groups : [groups],
      IsTruncated: parsed?.ListGroupsResult?.IsTruncated || false,
    }
  } catch (error) {
    console.error('Error listing IAM groups:', error)
    throw error
  }
}

export async function deleteGroup(GroupName: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'DeleteGroup',
      GroupName,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error deleting IAM group:', error)
    throw error
  }
}

export async function addUserToGroup(GroupName: string, UserName: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'AddUserToGroup',
      GroupName,
      UserName,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error adding user to group:', error)
    throw error
  }
}

export async function removeUserFromGroup(GroupName: string, UserName: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'RemoveUserFromGroup',
      GroupName,
      UserName,
    })
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error removing user from group:', error)
    throw error
  }
}

export async function listGroupsForUser(UserName: string): Promise<{
  Groups: IAMGroup[]
  IsTruncated: boolean
}> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'ListGroupsForUser',
      UserName,
    })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListGroupsForUserResponse>(xmlData)
    
    const groups = parsed?.ListGroupsForUserResult?.Groups?.Group || []
    return {
      Groups: Array.isArray(groups) ? groups : [groups],
      IsTruncated: parsed?.ListGroupsForUserResult?.IsTruncated || false,
    }
  } catch (error) {
    console.error('Error listing groups for user:', error)
    throw error
  }
}

export async function listUsersForGroup(GroupName: string): Promise<{
  Users: Array<{ UserName: string; UserId: string; Arn: string; CreateDate: string; Path: string }>
  IsTruncated: boolean
}> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'ListUsersForGroup',
      GroupName,
    })
    
    const response = await api.get(`/iam?${queryParams.toString()}`)
    const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const parsed = parseXML<ListUsersForGroupResponse>(xmlData)
    
    const users = parsed?.ListUsersForGroupResult?.Users?.User || []
    return {
      Users: Array.isArray(users) ? users : [users],
      IsTruncated: parsed?.ListUsersForGroupResult?.IsTruncated || false,
    }
  } catch (error) {
    console.error('Error listing users for group:', error)
    throw error
  }
}

export async function deleteAccessKey(AccessKeyId: string, UserName?: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'DeleteAccessKey',
      AccessKeyId,
    })
    
    if (UserName) {
      queryParams.append('UserName', UserName)
    }
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error deleting access key:', error)
    throw error
  }
}

export async function updateAccessKeyStatus(AccessKeyId: string, Status: 'Active' | 'Inactive', UserName?: string): Promise<void> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'UpdateAccessKeyStatus',
      AccessKeyId,
      Status,
    })
    
    if (UserName) {
      queryParams.append('UserName', UserName)
    }
    
    await api.get(`/iam?${queryParams.toString()}`)
  } catch (error) {
    console.error('Error updating access key status:', error)
    throw error
  }
}

export async function listUserPolicies(UserName: string): Promise<ListUserPoliciesResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'ListUserPolicies',
      UserName,
    })
    
    const response = await api.get<ListUserPoliciesResponse>(`/iam?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error listing user policies:', error)
    throw error
  }
}

export async function listRolePolicies(RoleName: string): Promise<ListRolePoliciesResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'ListRolePolicies',
      RoleName,
    })
    
    const response = await api.get<ListRolePoliciesResponse>(`/iam?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error listing role policies:', error)
    throw error
  }
}

export async function getRolePolicy(RoleName: string, PolicyName: string): Promise<GetRolePolicyResponse> {
  try {
    const queryParams = new URLSearchParams({
      Action: 'GetRolePolicy',
      RoleName,
      PolicyName,
    })
    
    const response = await api.get<GetRolePolicyResponse>(`/iam?${queryParams.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error getting role policy:', error)
    throw error
  }
}
