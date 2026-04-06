// Connection status composable for AWS-compatible services
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const CONNECTION_CHECK_INTERVAL = 30000 // 30 seconds

// Global singleton state
const connectionStatus = ref({
  isConnected: false,
  isReachable: false,
  lastChecked: null as Date | null,
  endpoint: ''
})

let checkInterval: ReturnType<typeof setInterval> | null = null
let hasStartedMonitoring = false

// Check AWS endpoint connectivity
async function checkConnection(): Promise<boolean> {
  const settingsStore = useSettingsStore()
  const targetEndpoint = settingsStore.endpoint || 'http://localhost:4566'

  const strategies = [
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/health`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 403 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },

    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/s3`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },
    
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/lambda/2015-03-31/functions`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },
  ]
  
  for (const strategy of strategies) {
    try {
      const result = await strategy()
      if (result) {
        connectionStatus.value = {
          ...connectionStatus.value,
          isReachable: true,
          isConnected: true,
          lastChecked: new Date()
        }
        return true
      }
    } catch (e) {
      continue
    }
  }

  connectionStatus.value = {
    ...connectionStatus.value,
    isReachable: false,
    isConnected: false,
    lastChecked: new Date()
  }
  
  return false
}

// Set endpoint URL in settings and recheck
function setEndpoint(url: string): void {
  const settingsStore = useSettingsStore()
  settingsStore.setEndpoint(url)
  checkConnection()
}

// Get current endpoint from settings
function getEndpoint(): string {
  const settingsStore = useSettingsStore()
  return settingsStore.endpoint || 'http://localhost:4566'
}

// Start periodic checks - singleton pattern
function startMonitoring(): void {
  if (hasStartedMonitoring) return
  
  hasStartedMonitoring = true
  checkConnection()
  checkInterval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL)
}

// Stop periodic checks
function stopMonitoring(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
    hasStartedMonitoring = false
  }
}

export function useConnectionStatus() {
  onMounted(() => {
    startMonitoring()
  })

  return {
    status: computed(() => connectionStatus.value),
    isConnected: computed(() => connectionStatus.value.isConnected),
    isReachable: computed(() => connectionStatus.value.isReachable),
    lastChecked: computed(() => connectionStatus.value.lastChecked),
    endpoint: computed(() => getEndpoint()),
    checkConnection,
    setEndpoint,
    getEndpoint,
    startMonitoring,
    stopMonitoring
  }
}

// Export for direct access
export { connectionStatus, checkConnection, startMonitoring, stopMonitoring }
