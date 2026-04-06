// Centralized function to refresh all API clients when settings change
// Note: The new implementation uses simple HTTP calls to Go proxy,
// so no client refresh is needed - endpoint is read from settings on each request
export function refreshAllClients(): void {
  // No-op: the HTTP-based implementation reads endpoint directly from settings
  // No need to recreate clients when settings change
}

export function refreshApiClient(): void {
  // No-op
}

export function refreshS3Client(): void {
  // No-op
}

export function refreshLambdaClient(): void {
  // No-op
}

export function refreshDynamoDBClient(): void {
  // No-op
}

export function refreshSQSClient(): void {
  // No-op
}

export function refreshSNSClient(): void {
  // No-op
}

export function refreshAPIGatewayClient(): void {
  // No-op
}

export function refreshKinesisClient(): void {
  // No-op
}

export function refreshKMSClient(): void {
  // No-op
}

export function refreshSecretsManagerClient(): void {
  // No-op
}

export function refreshSSMClient(): void {
  // No-op
}