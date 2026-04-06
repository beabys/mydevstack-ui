<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Tabs from '@/components/common/Tabs.vue'
import * as apigateway from '@/api/services/api-gateway'
import { refreshAPIGatewayClient } from '@/api/services/api-gateway'
import type { APIGatewayRestAPI, APIGatewayResource, APIGatewayMethod } from '@/api/types/aws'

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toast = useToast()

// State
const activeTab = ref<'rest' | 'http'>('rest')
const loading = ref(false)

// REST API state
const restApis = ref<APIGatewayRestAPI[]>([])
const restResources = ref<APIGatewayResource[]>([])
const restMethods = ref<Record<string, APIGatewayMethod>>({})
const selectedRestApi = ref<APIGatewayRestAPI | null>(null)
const selectedResource = ref<APIGatewayResource | null>(null)
const loadingRestApis = ref(false)
const loadingResources = ref(false)
const loadingMethods = ref(false)

// HTTP API state
const httpApis = ref<any[]>([])
const httpRoutes = ref<any[]>([])
const httpIntegrations = ref<any[]>([])
const selectedHttpApi = ref<any | null>(null)
const loadingHttpApis = ref(false)
const loadingRoutes = ref(false)
const loadingIntegrations = ref(false)

// Modal state
const showCreateRestModal = ref(false)
const showCreateResourceModal = ref(false)
const showCreateMethodModal = ref(false)
const showCreateHttpModal = ref(false)
const showCreateRouteModal = ref(false)
const showCreateIntegrationModal = ref(false)
const showResourcesModal = ref(false)
const showRoutesModal = ref(false)
const showIntegrationsModal = ref(false)
const showImportSwaggerModal = ref(false)
const showEditRestModal = ref(false)
const showViewRestModal = ref(false)
const showDeleteRestModal = ref(false)
const showDeleteResourceModal = ref(false)
const showIntegrationModal = ref(false)
const showMethodsModal = ref(false)

// Swagger import state
const swaggerFile = ref<File | null>(null)
const swaggerContent = ref('')
const swaggerValidationErrors = ref<string[]>([])
const swaggerSpecPreview = ref<{ title: string; version: string; pathCount: number } | null>(null)
const importingSwagger = ref(false)
const swaggerImportResult = ref<{
  success: boolean
  apiId?: string
  apiName?: string
  resourcesCreated?: number
  methodsCreated?: number
  errors?: string[]
} | null>(null)

// Edit REST API state
const editingRestApi = ref<APIGatewayRestAPI | null>(null)
const editRestApiName = ref('')
const editRestApiDescription = ref('')
const editing = ref(false)

// View REST API state
const viewRestApiDetails = ref<APIGatewayRestAPI | null>(null)
const viewLoading = ref(false)

// Delete REST API state
const apiToDelete = ref<APIGatewayRestAPI | null>(null)
const deleting = ref(false)

// Delete Resource state
const resourceToDelete = ref<APIGatewayResource | null>(null)
const deletingResource = ref(false)

// Integration modal state
const selectedMethodForIntegration = ref<APIGatewayMethod | null>(null)
const selectedMethodName = ref('')
const loadingIntegration = ref(false)
const currentIntegration = ref<any>(null)
const newIntegrationType = ref('MOCK')
const newIntegrationUri = ref('')
const newIntegrationHttpMethod = ref('POST')
const savingIntegration = ref(false)

// Usage Examples
const selectedExample = ref(0)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List REST APIs
aws apigateway get-rest-apis --endpoint-url ${settingsStore.endpoint}

# Get REST API details
aws apigateway get-rest-api --rest-api-id <api-id> --endpoint-url ${settingsStore.endpoint}

# Create REST API
aws apigateway create-rest-api --name "my-api" --endpoint-url ${settingsStore.endpoint}

# Create Resource
aws apigateway create-resource --rest-api-id <api-id> --parent-id <parent-id> --path-part "items" --endpoint-url ${settingsStore.endpoint}

# Create Method (GET)
aws apigateway put-method --rest-api-id <api-id> --resource-id <resource-id> --http-method GET --authorization-type NONE --endpoint-url ${settingsStore.endpoint}

# Create Deployment
aws apigateway create-deployment --rest-api-id <api-id> --stage-name prod --endpoint-url ${settingsStore.endpoint}

# Delete REST API
aws apigateway delete-rest-api --rest-api-id <api-id> --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { APIGatewayClient, GetRestApisCommand, CreateRestApiCommand, GetRestApiCommand, DeleteRestApiCommand } from "@aws-sdk/client-api-gateway";

const client = new APIGatewayClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List REST APIs
const listResponse = await client.send(new GetRestApisCommand({}));
console.log('REST APIs:', listResponse.items);

// Create REST API
const createResponse = await client.send(new CreateRestApiCommand({
  name: 'my-api',
  description: 'My API',
}));
console.log('Created API:', createResponse);

// Get REST API details
const getResponse = await client.send(new GetRestApiCommand({
  restApiId: '<api-id>',
}));
console.log('API Details:', getResponse);

// Delete REST API
await client.send(new DeleteRestApiCommand({
  restApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'apigateway',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List REST APIs
response = client.get_rest_apis()
for api in response['items']:
    print(f"  {api['name']} ({api['id']})")

# Create REST API
response = client.create_rest_api(
    name='my-api',
    description='My API'
)
print(f"Created API: {response['id']}")

# Get REST API details
response = client.get_rest_api(rest_api_id='<api-id>')
print(f"API: {response}")

# Delete REST API
client.delete_rest_api(rest_api_id='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigateway"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := apigateway.New(apigateway.Options{
    Region: "${settingsStore.region}",
    BaseURL: aws.String("${settingsStore.endpoint}"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${settingsStore.accessKey}",
                SecretAccessKey: "${settingsStore.secretKey}",
            }, nil
        },
    ),
})

// List REST APIs
listOutput, err := client.GetRestApis(context.Background(), &apigateway.GetRestApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.Id))
}

// Create REST API
createOutput, err := client.CreateRestApi(context.Background(), &apigateway.CreateRestApiInput{
    Name:        aws.String("my-api"),
    Description: aws.String("My API"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created API ID: %s\\n", aws.StringValue(createOutput.Id))

// Delete REST API
_, err = client.DeleteRestApi(context.Background(), &apigateway.DeleteRestApiInput{
    RestApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("API deleted")`
  },
])

// HTTP API Examples
const httpApiExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List HTTP APIs
aws apigatewayv2 get-apis --endpoint-url ${settingsStore.endpoint}

# Get HTTP API details
aws apigatewayv2 get-api --api-id <api-id> --endpoint-url ${settingsStore.endpoint}

# Create HTTP API
aws apigatewayv2 create-api --name "my-http-api" --protocol-type HTTP --endpoint-url ${settingsStore.endpoint}

# Create Route
aws apigatewayv2 create-route --api-id <api-id> --route-key "GET /items" --endpoint-url ${settingsStore.endpoint}

# Create Integration
aws apigatewayv2 create-integration --api-id <api-id> --integration-type HTTP_PROXY --uri "http://localhost:8080" --endpoint-url ${settingsStore.endpoint}

# Create Stage
aws apigatewayv2 create-stage --api-id <api-id> --stage-name prod --endpoint-url ${settingsStore.endpoint}

# Delete HTTP API
aws apigatewayv2 delete-api --api-id <api-id> --endpoint-url ${settingsStore.endpoint}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3 - ApiGatewayV2
import { ApiGatewayV2Client, GetApisCommand, CreateApiCommand, DeleteApiCommand } from "@aws-sdk/client-api-gatewayv2";

const client = new ApiGatewayV2Client({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.endpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List HTTP APIs
const listResponse = await client.send(new GetApisCommand({}));
console.log('HTTP APIs:', listResponse.Items);

// Create HTTP API
const createResponse = await client.send(new CreateApiCommand({
  Name: 'my-http-api',
  ProtocolType: 'HTTP',
}));
console.log('Created HTTP API:', createResponse);

// Delete HTTP API
await client.send(new DeleteApiCommand({
  ApiId: '<api-id>',
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3 - apigatewayv2
import boto3

client = boto3.client(
    'apigatewayv2',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.endpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List HTTP APIs
response = client.get_apis()
for api in response['Items']:
    print(f"  {api['Name']} ({api['ApiId']})")

# Create HTTP API
response = client.create_api(
    Name='my-http-api',
    ProtocolType='HTTP'
)
print(f"Created API: {response['ApiId']}")

# Delete HTTP API
client.delete_api(ApiId='<api-id>')`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2 - ApiGatewayV2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := apigatewayv2.New(apigatewayv2.Options{
    Region: "${settingsStore.region}",
    BaseURL: aws.String("${settingsStore.endpoint}"),
    Credentials: aws.CredentialsProviderFunc(
        func(ctx context.Context) (aws.Credentials, error) {
            return aws.Credentials{
                AccessKeyID:     "${settingsStore.accessKey}",
                SecretAccessKey: "${settingsStore.secretKey}",
            }, nil
        },
    ),
})

// List HTTP APIs
listOutput, err := client.GetApis(context.Background(), &apigatewayv2.GetApisInput{})
if err != nil {
    panic(err)
}
for _, api := range listOutput.Items {
    fmt.Printf("HTTP API: %s (%s)\\n", aws.StringValue(api.Name), aws.StringValue(api.ApiId))
}

// Create HTTP API
createOutput, err := client.CreateApi(context.Background(), &apigatewayv2.CreateApiInput{
    Name:        aws.String("my-http-api"),
    ProtocolType: aws.String("HTTP"),
})
if err != nil {
    panic(err)
}
fmt.Printf("Created HTTP API ID: %s\\n", aws.StringValue(createOutput.ApiId))

// Delete HTTP API
_, err = client.DeleteApi(context.Background(), &apigatewayv2.DeleteApiInput{
    ApiId: aws.String("<api-id>"),
})
if err != nil {
    panic(err)
}
fmt.Println("HTTP API deleted")`
  },
])

// Selected example index for each tab
const restExampleIndex = ref(0)
const httpExampleIndex = ref(0)

// Form state
const newRestApiName = ref('')
const newRestApiDescription = ref('')
const newResourcePath = ref('')
const newResourceParentId = ref('')
const newMethodType = ref('GET')
const newMethodResourceId = ref('')
const newHttpApiName = ref('')
const newHttpApiDescription = ref('')
const newRouteKey = ref('GET /')

const creating = ref(false)

// Handle Swagger file selection
function handleSwaggerFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  swaggerFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    swaggerContent.value = content
    validateSwaggerContent(content)
  }
  reader.readAsText(file)
}

// Validate Swagger content
function validateSwaggerContent(content: string) {
  swaggerValidationErrors.value = []
  swaggerSpecPreview.value = null
  
  try {
    const spec = apigateway.parseSwaggerSpec(content)
    const errors = apigateway.validateSwaggerSpec(spec)
    
    if (errors.length > 0) {
      swaggerValidationErrors.value = errors
      return
    }
    
    swaggerSpecPreview.value = {
      title: spec.info.title,
      version: spec.info.version,
      pathCount: Object.keys(spec.paths).length,
    }
  } catch (error) {
    swaggerValidationErrors.value = [`Failed to parse file: ${error}`]
  }
}

// Import Swagger file
async function importSwaggerFile() {
  if (!swaggerContent.value || swaggerValidationErrors.value.length > 0) {
    toast.error('Please fix validation errors before importing')
    return
  }
  
  importingSwagger.value = true
  swaggerImportResult.value = null
  
  try {
    const result = await apigateway.importSwaggerFromFile(swaggerContent.value)
    
    swaggerImportResult.value = {
      success: result.errors.length === 0,
      apiId: result.apiId,
      apiName: result.apiName,
      resourcesCreated: result.resourcesCreated,
      methodsCreated: result.methodsCreated,
      errors: result.errors,
    }
    
    if (result.errors.length === 0) {
      toast.success(`Imported ${result.resourcesCreated} resources and ${result.methodsCreated} methods`)
      showImportSwaggerModal.value = false
      loadRestApis()
      resetSwaggerImport()
    } else {
      toast.warning(`Imported with ${result.errors.length} errors`)
    }
  } catch (error) {
    console.error('Error importing Swagger:', error)
    toast.error('Failed to import Swagger specification')
  } finally {
    importingSwagger.value = false
  }
}

// Reset Swagger import state
function resetSwaggerImport() {
  swaggerFile.value = null
  swaggerContent.value = ''
  swaggerValidationErrors.value = []
  swaggerSpecPreview.value = null
  swaggerImportResult.value = null
}

// Clear import modal
function closeImportModal() {
  showImportSwaggerModal.value = false
  resetSwaggerImport()
}

// REST API columns
const restApiColumns = computed(() => [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'id', label: 'ID', sortable: false },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'createdDate', label: 'Created', sortable: true },
])

// Resource columns
const resourceColumns = computed(() => [
  { key: 'path', label: 'Path', sortable: true },
  { key: 'pathPart', label: 'Path Part', sortable: false },
  { key: 'id', label: 'Resource ID', sortable: false },
])

// HTTP API columns
const httpApiColumns = computed(() => [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'apiId', label: 'API ID', sortable: false },
  { key: 'apiEndpoint', label: 'Endpoint', sortable: false },
  { key: 'createdDate', label: 'Created', sortable: true },
])

// Route columns
const routeColumns = computed(() => [
  { key: 'routeKey', label: 'Route Key', sortable: true },
  { key: 'routeId', label: 'Route ID', sortable: false },
])

// Integration columns
const integrationColumns = computed(() => [
  { key: 'integrationType', label: 'Type', sortable: true },
  { key: 'integrationId', label: 'Integration ID', sortable: false },
  { key: 'integrationUri', label: 'URI', sortable: false },
])

// Load REST APIs
async function loadRestApis() {
  loadingRestApis.value = true
  try {
    const response = await apigateway.getRestApis()
    restApis.value = response.items || []
  } catch (error) {
    console.error('Error loading REST APIs:', error)
    toast.error('Failed to load REST APIs')
  } finally {
    loadingRestApis.value = false
  }
}

// Load resources for selected REST API
async function loadResources(api: APIGatewayRestAPI) {
  selectedRestApi.value = api
  loadingResources.value = true
  showResourcesModal.value = true
  try {
    const response = await apigateway.getResources(api.id)
    console.log('GetResources response:', response)
    restResources.value = response.items || []
    console.log('Resources loaded:', restResources.value.map(r => ({ id: r.id, path: r.path, methods: Object.keys(r.resourceMethods || {}).join(',') })))
  } catch (error) {
    console.error('Error loading resources:', error)
    toast.error('Failed to load resources')
  } finally {
    loadingResources.value = false
  }
}

// Load methods for selected resource
async function loadMethods(resource: APIGatewayResource) {
  if (!selectedRestApi.value) return
  selectedResource.value = resource
  loadingMethods.value = true

  restMethods.value = {}
  console.log('Loading methods for resource:', resource.id, 'path:', resource.path)
  
  // Try to load all common HTTP methods since LocalStack's GetResources 
  // doesn't reliably return resourceMethods
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
  
  for (const method of httpMethods) {
    try {
      const methodDetails = await apigateway.getMethod(selectedRestApi.value.id, resource.id, method)
      console.log(`Method ${method} details:`, methodDetails)
      restMethods.value[method] = methodDetails
    } catch (error: any) {
      // Method doesn't exist - that's expected for most methods
      // LocalStack returns 500 for non-existent methods, so treat 500 as "doesn't exist"
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const status = error.statusCode
        // 404 or 500 typically means method doesn't exist
        if (status === 404 || status === 500) {
          // Method doesn't exist - silently skip
          continue
        }
      }
      // Unexpected error - log it but don't fail
      console.log(`Method ${method} error:`, error?.message)
    }
  }
  loadingMethods.value = false
  console.log('Loaded methods:', Object.keys(restMethods.value))
  showMethodsModal.value = true
}

// Create REST API
async function createRestApi() {
  if (!newRestApiName.value) {
    toast.error('API name is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRestApi(newRestApiName.value, {
      Description: newRestApiDescription.value,
    })
    toast.success('REST API created successfully')
    showCreateRestModal.value = false
    newRestApiName.value = ''
    newRestApiDescription.value = ''
    loadRestApis()
  } catch (error) {
    console.error('Error creating REST API:', error)
    toast.error('Failed to create REST API: ' + String(error))
  } finally {
    creating.value = false
  }
}

// View REST API details
async function viewRestApi(api: APIGatewayRestAPI) {
  console.log('viewRestApi called with:', api)
  viewRestApiDetails.value = null
  viewLoading.value = true
  showViewRestModal.value = true
  
  try {
    const details = await apigateway.getRestApi(api.id)
    console.log('API details response:', details)
    viewRestApiDetails.value = details
  } catch (error) {
    console.error('Error getting REST API details:', error)
    toast.error('Failed to load API details')
    showViewRestModal.value = false
  } finally {
    viewLoading.value = false
  }
}

// Open edit modal
function openEditModal(api: APIGatewayRestAPI) {
  editingRestApi.value = api
  editRestApiName.value = api.name
  editRestApiDescription.value = api.description || ''
  showEditRestModal.value = true
}

// Update REST API
async function updateRestApi() {
  if (!editingRestApi.value || !editRestApiName.value.trim()) {
    toast.error('API name is required')
    return
  }

  editing.value = true
  try {
    await apigateway.updateRestApi(editingRestApi.value.id, {
      name: editRestApiName.value.trim(),
      description: editRestApiDescription.value.trim(),
    })
    toast.success('REST API updated successfully')
    showEditRestModal.value = false
    editingRestApi.value = null
    loadRestApis()
  } catch (error) {
    console.error('Error updating REST API:', error)
    toast.error('Failed to update REST API')
  } finally {
    editing.value = false
  }
}

// Open delete confirmation
function openDeleteModal(api: APIGatewayRestAPI) {
  apiToDelete.value = api
  showDeleteRestModal.value = true
}

// Delete REST API
async function confirmDeleteRestApi() {
  if (!apiToDelete.value) return

  deleting.value = true
  try {
    await apigateway.deleteRestApi(apiToDelete.value.id)
    toast.success('REST API deleted successfully')
    showDeleteRestModal.value = false
    apiToDelete.value = null
    loadRestApis()
  } catch (error) {
    console.error('Error deleting REST API:', error)
    toast.error('Failed to delete REST API')
  } finally {
    deleting.value = false
  }
}

// Open delete resource modal
function openDeleteResourceModal(resource: APIGatewayResource) {
  resourceToDelete.value = resource
  showDeleteResourceModal.value = true
}

// Delete resource
async function confirmDeleteResource() {
  if (!selectedRestApi.value || !resourceToDelete.value) return

  deletingResource.value = true
  try {
    await apigateway.deleteResource(selectedRestApi.value.id, resourceToDelete.value.id)
    toast.success('Resource deleted successfully')
    showDeleteResourceModal.value = false
    resourceToDelete.value = null
    loadResources(selectedRestApi.value)
  } catch (error) {
    console.error('Error deleting resource:', error)
    toast.error('Failed to delete resource')
  } finally {
    deletingResource.value = false
  }
}

// Open integration modal for a method
async function openIntegrationModalForMethod(method: string) {
  if (!selectedRestApi.value || !selectedResource.value) return
  
  selectedMethodName.value = method
  selectedMethodForIntegration.value = restMethods.value[method]
  loadingIntegration.value = true
  newIntegrationType.value = 'MOCK'
  newIntegrationUri.value = ''
  newIntegrationHttpMethod.value = 'POST'
  
  showIntegrationModal.value = true
  
  try {
    const integration = await apigateway.getIntegration(
      selectedRestApi.value.id,
      selectedResource.value.id,
      method
    )
    currentIntegration.value = integration
    newIntegrationType.value = integration.type || 'MOCK'
    newIntegrationUri.value = integration.uri || ''
    newIntegrationHttpMethod.value = integration.integrationHttpMethod || 'POST'
  } catch (error: any) {
    // Integration might not exist - that's ok, we'll create one
    console.log('No integration exists yet:', error?.message)
    currentIntegration.value = null
  } finally {
    loadingIntegration.value = false
  }
}

// Save integration for method
async function saveIntegration() {
  if (!selectedRestApi.value || !selectedResource.value || !selectedMethodName.value) {
    toast.error('No method selected')
    return
  }

  savingIntegration.value = true
  try {
    await apigateway.putIntegration(
      selectedRestApi.value.id,
      selectedResource.value.id,
      selectedMethodName.value,
      {
        type: newIntegrationType.value,
        uri: newIntegrationUri.value,
        integrationHttpMethod: newIntegrationHttpMethod.value,
      }
    )
    toast.success('Integration saved successfully')
    showIntegrationModal.value = false
    // Reload method to get updated integration
    loadMethods(selectedResource.value)
  } catch (error) {
    console.error('Error saving integration:', error)
    toast.error('Failed to save integration')
  } finally {
    savingIntegration.value = false
  }
}

// Delete method
async function deleteMethod(method: string) {
  if (!selectedRestApi.value || !selectedResource.value) return
  
  if (!confirm(`Delete method ${method}?`)) return
  
  try {
    await apigateway.deleteMethod(
      selectedRestApi.value.id,
      selectedResource.value.id,
      method
    )
    toast.success(`Method ${method} deleted successfully`)
    loadMethods(selectedResource.value)
  } catch (error) {
    console.error('Error deleting method:', error)
    toast.error('Failed to delete method')
  }
}

// Create resource
async function createResource() {
  console.log('Creating resource with:', {
    selectedApi: selectedRestApi.value,
    restResources: restResources.value,
    selectedResource: selectedResource.value,
    newPath: newResourcePath.value
  })
  
  if (!selectedRestApi.value || !newResourcePath.value) {
    toast.error('Resource path is required')
    return
  }

  creating.value = true
  try {
    // Use selected parent or fall back to root
    const parentId = newResourceParentId.value || restResources.value.find(r => r.path === '/')?.id

    if (!parentId) {
      toast.error('No parent resource found')
      return
    }

    await apigateway.createResource(selectedRestApi.value.id, parentId, newResourcePath.value)
    toast.success('Resource created successfully')
    showCreateResourceModal.value = false
    newResourcePath.value = ''
    newResourceParentId.value = ''
    loadResources(selectedRestApi.value)
  } catch (error) {
    console.error('Error creating resource:', error)
    toast.error('Failed to create resource')
  } finally {
    creating.value = false
  }
}

// Create method
async function createMethod() {
  if (!selectedRestApi.value || !newMethodResourceId.value || !newMethodType.value) {
    toast.error('Resource and method type are required')
    return
  }

  const resourceId = newMethodResourceId.value
  const methodType = newMethodType.value
  
  console.log('Creating method:', {
    apiId: selectedRestApi.value.id,
    resourceId: resourceId,
    method: methodType
  })
  
  creating.value = true
  try {
    const result = await apigateway.createMethod(
      selectedRestApi.value.id,
      resourceId,
      methodType,
      { authorizationType: 'NONE' }
    )
    console.log('Create method result:', result)
    toast.success('Method created successfully')
    
    // Close the Create Method modal
    showCreateMethodModal.value = false
    newMethodType.value = 'GET'
    newMethodResourceId.value = ''
    
    // Add the newly created method directly to restMethods since LocalStack's 
    // GetResources doesn't return resourceMethods after creation
    restMethods.value[methodType] = result
    console.log('Updated restMethods:', restMethods.value)
    console.log('Methods modal should show:', Object.keys(restMethods.value))
    
    // Show the methods modal with the new method
    showMethodsModal.value = true
  } catch (error) {
    console.error('Error creating method:', error)
    toast.error('Failed to create method: ' + String(error))
  } finally {
    creating.value = false
  }
}

// HTTP APIs
async function loadHttpApis() {
  loadingHttpApis.value = true
  try {
    const response = await apigateway.getHttpApis()
    httpApis.value = response.items || []
  } catch (error) {
    console.error('Error loading HTTP APIs:', error)
    toast.error('Failed to load HTTP APIs')
  } finally {
    loadingHttpApis.value = false
  }
}

// Load routes for HTTP API
async function loadRoutes(api: any) {
  selectedHttpApi.value = api
  loadingRoutes.value = true
  showRoutesModal.value = true
  try {
    const response = await apigateway.getRoutes(api.apiId)
    httpRoutes.value = response.items || []
  } catch (error) {
    console.error('Error loading routes:', error)
    toast.error('Failed to load routes')
  } finally {
    loadingRoutes.value = false
  }
}

// Load integrations for HTTP API
async function loadIntegrations(api: any) {
  selectedHttpApi.value = api
  loadingIntegrations.value = true
  showIntegrationsModal.value = true
  try {
    const response = await apigateway.getIntegrations(api.apiId)
    httpIntegrations.value = response.items || []
  } catch (error) {
    console.error('Error loading integrations:', error)
    toast.error('Failed to load integrations')
  } finally {
    loadingIntegrations.value = false
  }
}

// Create HTTP API
async function createHttpApi() {
  creating.value = true
  try {
    const options: any = {}
    if (newHttpApiName.value) options.name = newHttpApiName.value
    if (newHttpApiDescription.value) options.description = newHttpApiDescription.value
    
    await apigateway.createHttpApi(options)
    toast.success('HTTP API created successfully')
    showCreateHttpModal.value = false
    newHttpApiName.value = ''
    newHttpApiDescription.value = ''
    loadHttpApis()
  } catch (error: any) {
    console.error('Error creating HTTP API:', error)
    const message = error?.message || 'Failed to create HTTP API'
    toast.error(message)
  } finally {
    creating.value = false
  }
}

// Delete HTTP API
async function deleteHttpApi(api: any) {
  if (!confirm(`Delete HTTP API "${api.name}"?`)) return

  try {
    await apigateway.deleteHttpApi(api.apiId)
    toast.success('HTTP API deleted successfully')
    loadHttpApis()
  } catch (error) {
    console.error('Error deleting HTTP API:', error)
    toast.error('Failed to delete HTTP API')
  }
}

// Create route
async function createRoute() {
  if (!selectedHttpApi.value || !newRouteKey.value) {
    toast.error('Route key is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createRoute(selectedHttpApi.value.apiId, {
      routeKey: newRouteKey.value,
    })
    toast.success('Route created successfully')
    showCreateRouteModal.value = false
    newRouteKey.value = 'GET /'
    loadRoutes(selectedHttpApi.value)
  } catch (error) {
    console.error('Error creating route:', error)
    toast.error('Failed to create route')
  } finally {
    creating.value = false
  }
}

// Create integration
async function createIntegration() {
  if (!selectedHttpApi.value || !newIntegrationUri.value) {
    toast.error('Integration URI is required')
    return
  }

  creating.value = true
  try {
    await apigateway.createIntegration(selectedHttpApi.value.apiId, {
      integrationType: 'AWS_PROXY',
      integrationUri: newIntegrationUri.value,
      integrationMethod: 'POST',
      payloadFormatVersion: '2.0',
    })
    toast.success('Integration created successfully')
    showCreateIntegrationModal.value = false
    newIntegrationUri.value = ''
    loadIntegrations(selectedHttpApi.value)
  } catch (error) {
    console.error('Error creating integration:', error)
    toast.error('Failed to create integration')
  } finally {
    creating.value = false
  }
}

// Copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

onMounted(() => {
  loadRestApis()
  loadHttpApis()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2
        class="text-xl font-semibold"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        API Gateway
      </h2>
    </div>

    <!-- Tabs -->
    <Tabs
      v-model:active-tab="activeTab"
      :tabs="[
        { id: 'rest', label: 'REST APIs' },
        { id: 'http', label: 'HTTP APIs' },
      ]"
    />

    <!-- REST APIs -->
    <div
      v-if="activeTab === 'rest'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          REST APIs
        </h3>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            @click="showImportSwaggerModal = true"
          >
            <template #icon>
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </template>
            Import Swagger
          </Button>
          <Button @click="showCreateRestModal = true">
            <template #icon>
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </template>
            Create REST API
          </Button>
        </div>
      </div>

      <EmptyState
        v-if="!loadingRestApis && restApis.length === 0"
        icon="server"
        title="No REST APIs"
        description="Create your first REST API to get started."
        @action="showCreateRestModal = true"
      />

      <DataTable
        v-else
        :columns="restApiColumns"
        :data="restApis"
        :loading="loadingRestApis"
        empty-title="No REST APIs"
        empty-text="No REST APIs found."
      >
        <template #cell-name="{ value }">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
            <span class="font-medium">{{ value }}</span>
          </div>
        </template>

        <template #cell-id="{ value }">
          <div class="flex items-center gap-2">
            <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
            <button
              class="text-light-muted dark:text-dark-muted hover:text-primary-500"
              @click="copyToClipboard(value)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </template>

        <template #cell-description="{ value }">
          <span class="text-light-muted dark:text-dark-muted">{{ value || '-' }}</span>
        </template>

        <template #cell-createdDate="{ value }">
          {{ new Date(value).toLocaleDateString() }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="View Details"
              @click="viewRestApi(row)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Edit"
              @click="openEditModal(row)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadResources(row)"
            >
              Resources
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete"
              @click="openDeleteModal(row)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- HTTP APIs -->
    <div
      v-if="activeTab === 'http'"
      class="space-y-6"
    >
      <div class="flex items-center justify-between">
        <h3
          class="text-lg font-medium"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          HTTP APIs
        </h3>
        <Button @click="showCreateHttpModal = true">
          <template #icon>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Create HTTP API
        </Button>
      </div>

      <EmptyState
        v-if="!loadingHttpApis && httpApis.length === 0"
        icon="server"
        title="No HTTP APIs"
        description="Create your first HTTP API to get started."
        @action="showCreateHttpModal = true"
      />

      <DataTable
        v-else
        :columns="httpApiColumns"
        :data="httpApis"
        :loading="loadingHttpApis"
        empty-title="No HTTP APIs"
        empty-text="No HTTP APIs found."
      >
        <template #cell-name="{ value }">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
            <span class="font-medium">{{ value }}</span>
          </div>
        </template>

        <template #cell-apiId="{ value }">
          <div class="flex items-center gap-2">
            <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
            <button
              class="text-light-muted dark:text-dark-muted hover:text-primary-500"
              @click="copyToClipboard(value)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </template>

        <template #cell-apiEndpoint="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value || '-' }}</code>
        </template>

        <template #cell-createdDate="{ value }">
          {{ new Date(value).toLocaleDateString() }}
        </template>

        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadRoutes(row)"
            >
              Routes
            </button>
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadIntegrations(row)"
            >
              Integrations
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete"
              @click="deleteHttpApi(row)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create REST API Modal -->
    <Modal
      v-model:open="showCreateRestModal"
      title="Create REST API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRestApiName"
          label="API Name"
          placeholder="my-rest-api"
          required
        />
        <FormInput
          v-model="newRestApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateRestModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRestApi"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create HTTP API Modal -->
    <Modal
      v-model:open="showCreateHttpModal"
      title="Create HTTP API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newHttpApiName"
          label="API Name"
          placeholder="my-http-api"
        />
        <FormInput
          v-model="newHttpApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateHttpModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createHttpApi"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Resources Modal -->
    <Modal
      v-model:open="showResourcesModal"
      :title="`Resources: ${selectedRestApi?.name}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="showCreateResourceModal = true"
        >
          <template #icon>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Create Resource
        </Button>
      </div>

      <div
        v-if="loadingResources"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="restResources.length === 0"
        icon="server"
        title="No Resources"
        description="No resources found for this API."
      />

      <DataTable
        v-else
        :columns="resourceColumns"
        :data="restResources"
        empty-title="No Resources"
        empty-text="No resources found."
      >
        <template #cell-path="{ value }">
          <span class="font-mono">{{ value }}</span>
        </template>
        <template #cell-pathPart="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
        <template #row-actions="{ row }">
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              @click="loadMethods(row)"
            >
              Methods
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete"
              @click="openDeleteResourceModal(row)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </template>
      </DataTable>

        <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showResourcesModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>
    <Modal
      v-model:open="showCreateMethodModal"
      title="Create Method"
      size="md"
      :z-index="60"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Resource</label>
          <select
            v-model="newMethodResourceId"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="">Select a resource...</option>
            <option
              v-for="resource in restResources"
              :key="resource.id"
              :value="resource.id"
            >
              {{ resource.path }} ({{ resource.pathPart }})
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">HTTP Method</label>
          <select
            v-model="newMethodType"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="OPTIONS">OPTIONS</option>
            <option value="HEAD">HEAD</option>
          </select>
        </div>
        <FormInput
          v-model="newIntegrationUri"
          label="Integration URI (optional)"
          placeholder="arn:aws:apigateway:region:lambda:path/..."
          hint="Leave empty for mock integration"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateMethodModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createMethod"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Resource Modal -->
    <Modal
      v-model:open="showCreateResourceModal"
      title="Create Resource"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newResourcePath"
          label="Resource Path"
          placeholder="items"
          required
        />
        <div>
          <label class="block text-sm font-medium mb-1">Parent Resource</label>
          <select
            v-model="newResourceParentId"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="">Root (/)</option>
            <option
              v-for="resource in restResources.filter(r => r.path !== '/')"
              :key="resource.id"
              :value="resource.id"
            >
              {{ resource.path }} ({{ resource.pathPart }})
            </option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateResourceModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createResource"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Routes Modal -->
    <Modal
      v-model:open="showRoutesModal"
      :title="`Routes: ${selectedHttpApi?.name}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="showCreateRouteModal = true"
        >
          <template #icon>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Create Route
        </Button>
      </div>

      <div
        v-if="loadingRoutes"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="httpRoutes.length === 0"
        icon="server"
        title="No Routes"
        description="No routes found for this API."
      />

      <DataTable
        v-else
        :columns="routeColumns"
        :data="httpRoutes"
        empty-title="No Routes"
        empty-text="No routes found."
      >
        <template #cell-routeKey="{ value }">
          <span class="font-mono font-medium">{{ value }}</span>
        </template>
        <template #cell-routeId="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showRoutesModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Route Modal -->
    <Modal
      v-model:open="showCreateRouteModal"
      title="Create Route"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newRouteKey"
          label="Route Key"
          placeholder="GET /items/{id}"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateRouteModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createRoute"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Integrations Modal -->
    <Modal
      v-model:open="showIntegrationsModal"
      :title="`Integrations: ${selectedHttpApi?.name}`"
      size="lg"
    >
      <div class="flex justify-end mb-4">
        <Button
          size="sm"
          @click="showCreateIntegrationModal = true"
        >
          <template #icon>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Create Integration
        </Button>
      </div>

      <div
        v-if="loadingIntegrations"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="httpIntegrations.length === 0"
        icon="server"
        title="No Integrations"
        description="No integrations found for this API."
      />

      <DataTable
        v-else
        :columns="integrationColumns"
        :data="httpIntegrations"
        empty-title="No Integrations"
        empty-text="No integrations found."
      >
        <template #cell-integrationType="{ value }">
          <span class="font-medium">{{ value }}</span>
        </template>
        <template #cell-integrationId="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value }}</code>
        </template>
        <template #cell-integrationUri="{ value }">
          <code class="text-xs bg-light-border dark:bg-dark-border px-2 py-1 rounded">{{ value || '-' }}</code>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showIntegrationsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Create Integration Modal -->
    <Modal
      v-model:open="showCreateIntegrationModal"
      title="Create Integration"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newIntegrationUri"
          label="Integration URI"
          placeholder="arn:aws:apigateway:region:lambda:path/2015-03-31/functions/arn:aws:lambda:region:account-id:function:function-name/invocations"
          required
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showCreateIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="creating"
            @click="createIntegration"
          >
            Create
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Import Swagger Modal -->
    <Modal
      v-model:open="showImportSwaggerModal"
      title="Import Swagger / OpenAPI Specification"
      size="lg"
    >
      <div class="space-y-4">
        <!-- File Upload -->
        <div class="border-2 border-dashed border-light-border dark:border-dark-border rounded-lg p-6 text-center">
          <input
            id="swagger-file-input"
            type="file"
            accept=".json,.yaml,.yml"
            class="hidden"
            @change="handleSwaggerFileSelect"
          >
          <label
            for="swagger-file-input"
            class="cursor-pointer flex flex-col items-center gap-2"
          >
            <svg
              class="w-12 h-12 text-light-muted dark:text-dark-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span class="text-sm text-light-muted dark:text-dark-muted">
              Click to upload or drag and drop
            </span>
            <span class="text-xs text-light-muted dark:text-dark-muted">
              JSON or YAML files (.json, .yaml, .yml)
            </span>
          </label>
          <div
            v-if="swaggerFile"
            class="mt-4"
          >
            <div class="flex items-center gap-2 justify-center">
              <svg
                class="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-sm font-medium">{{ swaggerFile.name }}</span>
              <span class="text-xs text-light-muted dark:text-dark-muted">
                ({{ (swaggerFile.size / 1024).toFixed(2) }} KB)
              </span>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <div
          v-if="swaggerValidationErrors.length > 0"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Validation Errors:
          </h4>
          <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li
              v-for="(error, index) in swaggerValidationErrors"
              :key="index"
              class="flex items-start gap-2"
            >
              <svg
                class="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- Spec Preview -->
        <div
          v-if="swaggerSpecPreview"
          class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Specification Valid:
          </h4>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Title:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.title }}
              </p>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Version:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.version }}
              </p>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400 font-medium">Paths:</span>
              <p class="text-green-800 dark:text-green-200">
                {{ swaggerSpecPreview.pathCount }} endpoints
              </p>
            </div>
          </div>
        </div>

        <!-- Import Result -->
        <div
          v-if="swaggerImportResult"
          class="rounded-lg p-4"
          :class="swaggerImportResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'"
        >
          <div class="flex items-center gap-2 mb-3">
            <svg
              v-if="swaggerImportResult.success"
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span
              class="font-medium"
              :class="swaggerImportResult.success ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'"
            >
              {{ swaggerImportResult.success ? 'Import Successful' : 'Import Completed with Errors' }}
            </span>
          </div>
          
          <div
            v-if="swaggerImportResult.success"
            class="grid grid-cols-3 gap-4 text-sm mb-3"
          >
            <div>
              <span class="text-green-600 dark:text-green-400">API ID:</span>
              <code class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.apiId }}</code>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400">Resources:</span>
              <span class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.resourcesCreated }}</span>
            </div>
            <div>
              <span class="text-green-600 dark:text-green-400">Methods:</span>
              <span class="ml-1 text-green-800 dark:text-green-200">{{ swaggerImportResult.methodsCreated }}</span>
            </div>
          </div>
          
          <div v-if="swaggerImportResult.errors && swaggerImportResult.errors.length > 0">
            <h5 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Errors:
            </h5>
            <ul class="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
              <li
                v-for="(error, index) in swaggerImportResult.errors"
                :key="index"
              >
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <Button
            variant="secondary"
            @click="closeImportModal"
          >
            {{ swaggerImportResult ? 'Close' : 'Cancel' }}
          </Button>
          <Button
            v-if="!swaggerImportResult"
            :loading="importingSwagger"
            :disabled="!swaggerSpecPreview || swaggerValidationErrors.length > 0"
            @click="importSwaggerFile"
          >
            <template #icon>
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </template>
            Import Specification
          </Button>
        </div>
      </template>
    </Modal>

    <!-- View REST API Modal -->
    <Modal
      v-model:open="showViewRestModal"
      :title="`API Details: ${viewRestApiDetails?.name || ''}`"
      size="md"
    >
      <div
        v-if="viewLoading"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>
      
      <div
        v-else-if="viewRestApiDetails"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API ID</label>
            <p
              class="font-mono text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.id }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">API Key Source</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.apiKeySource || 'HEADER' }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Endpoint Type</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ viewRestApiDetails.endpointConfiguration?.types?.join(', ') || 'REGIONAL' }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Created</label>
            <p
              class="text-sm mt-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ new Date(viewRestApiDetails.createdDate * 1000).toLocaleString() }}
            </p>
          </div>
        </div>
        
        <div v-if="viewRestApiDetails.description">
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Description</label>
          <p
            class="text-sm mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            {{ viewRestApiDetails.description }}
          </p>
        </div>
        
        <div v-if="viewRestApiDetails.binaryMediaTypes?.length">
          <label class="text-sm font-medium text-light-muted dark:text-dark-muted">Binary Media Types</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="type in viewRestApiDetails.binaryMediaTypes"
              :key="type"
              class="px-2 py-1 text-xs rounded bg-light-border dark:bg-dark-border"
            >
              {{ type }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <Button
            variant="secondary"
            @click="showViewRestModal = false"
          >
            Close
          </Button>
          <div class="flex gap-2">
            <Button
              variant="secondary"
              @click="() => { showViewRestModal = false; openEditModal(viewRestApiDetails!) }"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              @click="() => { showViewRestModal = false; openDeleteModal(viewRestApiDetails!) }"
            >
              Delete
            </Button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Edit REST API Modal -->
    <Modal
      v-model:open="showEditRestModal"
      title="Edit REST API"
      size="md"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editRestApiName"
          label="API Name"
          placeholder="my-rest-api"
          required
        />
        <FormInput
          v-model="editRestApiDescription"
          label="Description"
          placeholder="Optional description"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showEditRestModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="editing"
            @click="updateRestApi"
          >
            Save Changes
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete REST API Confirmation -->
    <Modal
      v-model:open="showDeleteRestModal"
      title="Delete REST API"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the REST API <strong>"{{ apiToDelete?.name }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone. All resources and methods associated with this API will be deleted.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteRestModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            :loading="deleting"
            @click="confirmDeleteRestApi"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Methods Modal -->
    <Modal
      v-model:open="showMethodsModal"
      :title="`Methods: ${selectedResource?.path}`"
      size="lg"
    >
      <div class="flex justify-end mb-4 gap-2">
        <Button
          size="sm"
          variant="secondary"
          @click="showMethodsModal = false; showResourcesModal = false"
        >
          Close All
        </Button>
        <Button
          size="sm"
          @click="newMethodResourceId = selectedResource?.id || ''; showCreateMethodModal = true"
        >
          <template #icon>
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </template>
          Add Method
        </Button>
      </div>

      <div
        v-if="loadingMethods"
        class="flex justify-center py-8"
      >
        <LoadingSpinner />
      </div>

      <EmptyState
        v-else-if="Object.keys(restMethods).length === 0"
        icon="server"
        title="No Methods"
        description="No methods found for this resource."
      />

      <div v-else class="space-y-3">
        <div
          v-for="(methodDetails, method) in restMethods"
          :key="method"
          class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border"
        >
          <div class="flex items-center gap-3">
            <span
              class="px-2 py-1 text-xs font-bold rounded"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': method === 'GET',
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': method === 'POST',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': method === 'PUT',
                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': method === 'PATCH',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': method === 'DELETE',
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method),
              }"
            >
              {{ method }}
            </span>
            <span class="text-sm text-light-muted dark:text-dark-muted">
              Auth: {{ methodDetails.authorizationType || 'NONE' }}
            </span>
            <span
              v-if="methodDetails.apiKeyRequired"
              class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              API Key Required
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 text-sm rounded hover:bg-light-border dark:hover:bg-dark-border"
              title="Setup Integration"
              @click="openIntegrationModalForMethod(method)"
            >
              Integration
            </button>
            <button
              class="p-1 rounded hover:bg-light-border dark:hover:bg-dark-border text-red-500"
              title="Delete Method"
              @click="deleteMethod(method)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showMethodsModal = false"
          >
            Close
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Resource Confirmation -->
    <Modal
      v-model:open="showDeleteResourceModal"
      title="Delete Resource"
      size="sm"
    >
      <div class="space-y-4">
        <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
          Are you sure you want to delete the resource <strong>"{{ resourceToDelete?.path }}"</strong>?
        </p>
        <p class="text-sm text-red-500">
          This action cannot be undone. All methods associated with this resource will be deleted.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showDeleteResourceModal = false"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            :loading="deletingResource"
            @click="confirmDeleteResource"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Integration Setup Modal -->
    <Modal
      v-model:open="showIntegrationModal"
      title="Setup Integration"
      size="md"
    >
      <div v-if="loadingIntegration" class="flex justify-center py-8">
        <LoadingSpinner />
      </div>
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Integration Type</label>
          <select
            v-model="newIntegrationType"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="MOCK">Mock</option>
            <option value="AWS">AWS (Lambda)</option>
            <option value="HTTP">HTTP</option>
            <option value="HTTP_PROXY">HTTP Proxy</option>
          </select>
        </div>
        
        <FormInput
          v-model="newIntegrationUri"
          label="Integration URI"
          placeholder="arn:aws:apigateway:region:lambda:path/..."
          hint="Required for AWS, HTTP, and HTTP_PROXY types"
        />
        
        <div>
          <label class="block text-sm font-medium mb-1">Integration HTTP Method</label>
          <select
            v-model="newIntegrationHttpMethod"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>
        
        <div v-if="currentIntegration" class="text-sm text-light-muted dark:text-dark-muted">
          Current integration: {{ currentIntegration.type || 'None' }}
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            variant="secondary"
            @click="showIntegrationModal = false"
          >
            Cancel
          </Button>
          <Button
            :loading="savingIntegration"
            @click="saveIntegration"
          >
            Save
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Usage Examples -->
    <div
      v-if="activeTab === 'rest'"
      class="mt-8"
    >
      <h3 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        REST API Usage Examples
      </h3>
      <div 
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              restExampleIndex === index
                ? settingsStore.darkMode ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'
                : settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text hover:bg-dark-bg' : 'text-light-muted hover:text-light-text hover:bg-light-bg'
            ]"
            @click="restExampleIndex = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre 
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >{{ codeExamples[restExampleIndex].code }}</pre>
        </div>
      </div>
    </div>

    <!-- HTTP API Usage Examples -->
    <div
      v-if="activeTab === 'http'"
      class="mt-8"
    >
      <h3 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        HTTP API Usage Examples
      </h3>
      <div 
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <button
            v-for="(example, index) in httpApiExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              httpExampleIndex === index
                ? settingsStore.darkMode ? 'bg-dark-bg text-dark-text' : 'bg-light-bg text-light-text'
                : settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text hover:bg-dark-bg' : 'text-light-muted hover:text-light-text hover:bg-light-bg'
            ]"
            @click="httpExampleIndex = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre 
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >{{ httpApiExamples[httpExampleIndex].code }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
