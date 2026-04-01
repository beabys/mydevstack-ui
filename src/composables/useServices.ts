// Service definitions and helpers
import type { Service, ServiceCategoryInfo, ServiceCategory } from '@/types/services'

// Service category definitions with icons and ordering
export const SERVICE_CATEGORIES: ServiceCategoryInfo[] = [
  { id: 'compute', name: 'Compute', icon: 'ServerIcon', order: 1 },
  { id: 'storage', name: 'Storage', icon: 'CubeIcon', order: 2 },
  { id: 'database', name: 'Database', icon: 'DatabaseIcon', order: 3 },
  { id: 'messaging', name: 'Messaging', icon: 'PaperAirplaneIcon', order: 4 },
  { id: 'security', name: 'Security', icon: 'LockClosedIcon', order: 5 },
  { id: 'networking', name: 'Networking', icon: 'GlobeAltIcon', order: 6 },
  { id: 'analytics', name: 'Analytics', icon: 'ChartBarIcon', order: 7 },
  { id: 'orchestration', name: 'Orchestration', icon: 'ArrowsRightLeftIcon', order: 8 },
  { id: 'monitoring', name: 'Monitoring', icon: 'EyeIcon', order: 9 },
  { id: 'parameters', name: 'Parameters', icon: 'Cog6ToothIcon', order: 10 }
]

// All AWS services defined
export const SERVICES: Service[] = [
  // Compute
  { id: 'lambda', name: 'Lambda', category: 'compute', icon: 'CloudIcon', route: '/services/lambda' },
  
  // Storage
  { id: 's3', name: 'S3', category: 'storage', icon: 'ArchiveBoxIcon', route: '/services/s3' },
  { id: 'elasticache', name: 'ElastiCache', category: 'storage', icon: 'CircleStackIcon', route: '/services/elasticache' },
  { id: 'rds', name: 'RDS', category: 'storage', icon: 'ServerIcon', route: '/services/rds' },
  
  // Database
  { id: 'dynamodb', name: 'DynamoDB', category: 'database', icon: 'TableCellsIcon', route: '/services/dynamodb' },
  { id: 'dynamodb-streams', name: 'DynamoDB Streams', category: 'database', icon: 'PlayIcon', route: '/services/dynamodb-streams' },
  
  // Messaging
  { id: 'sqs', name: 'SQS', category: 'messaging', icon: 'QueueListIcon', route: '/services/sqs' },
  { id: 'sns', name: 'SNS', category: 'messaging', icon: 'MegaphoneIcon', route: '/services/sns' },
  { id: 'eventbridge', name: 'EventBridge', category: 'messaging', icon: 'BoltIcon', route: '/services/eventbridge' },
  
  // Security
  { id: 'iam', name: 'IAM', category: 'security', icon: 'UserGroupIcon', route: '/services/iam' },
  { id: 'kms', name: 'KMS', category: 'security', icon: 'KeyIcon', route: '/services/kms' },
  { id: 'secrets-manager', name: 'Secrets Manager', category: 'security', icon: 'ShieldCheckIcon', route: '/services/secrets-manager' },
  { id: 'cognito', name: 'Cognito', category: 'security', icon: 'IdentificationIcon', route: '/services/cognito' },
  
  // Networking
  { id: 'api-gateway', name: 'API Gateway', category: 'networking', icon: 'GlobeAltIcon', route: '/services/api-gateway' },
  
  // Analytics
  { id: 'kinesis', name: 'Kinesis', category: 'analytics', icon: 'WaveformIcon', route: '/services/kinesis' },
  
  // Orchestration
  { id: 'step-functions', name: 'Step Functions', category: 'orchestration', icon: 'ArrowsRightLeftIcon', route: '/services/step-functions' },
  { id: 'cloudformation', name: 'CloudFormation', category: 'orchestration', icon: 'CloudIcon', route: '/services/cloudformation' },
  
  // Monitoring
  { id: 'cloudwatch-logs', name: 'CloudWatch Logs', category: 'monitoring', icon: 'DocumentTextIcon', route: '/services/cloudwatch-logs' },
  { id: 'cloudwatch-metrics', name: 'CloudWatch Metrics', category: 'monitoring', icon: 'ChartBarIcon', route: '/services/cloudwatch-metrics' },
  
  // Parameters
  { id: 'ssm', name: 'SSM Parameter Store', category: 'parameters', icon: 'Cog6ToothIcon', route: '/services/ssm' }
]

// Get services grouped by category
export function getServicesByCategory(): Map<ServiceCategory, Service[]> {
  const grouped = new Map<ServiceCategory, Service[]>()
  
  for (const category of SERVICE_CATEGORIES) {
    grouped.set(
      category.id,
      SERVICES.filter(s => s.category === category.id)
    )
  }
  
  return grouped
}

// Get service by ID
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find(s => s.id === id)
}

// Get category info
export function getCategoryInfo(categoryId: ServiceCategory): ServiceCategoryInfo | undefined {
  return SERVICE_CATEGORIES.find(c => c.id === categoryId)
}

// Search services
export function searchServices(query: string): Service[] {
  const lowerQuery = query.toLowerCase()
  return SERVICES.filter(
    s => s.name.toLowerCase().includes(lowerQuery) ||
         s.id.toLowerCase().includes(lowerQuery)
  )
}
