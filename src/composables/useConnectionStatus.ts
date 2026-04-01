// Connection status composable for AWS-compatible services
import { ref, computed, onMounted, onUnmounted } from 'vue'

const CONNECTION_CHECK_INTERVAL = 30000 // 30 seconds

// Global state
const connectionStatus = ref({
  isConnected: false,
  isReachable: false,
  lastChecked: null as Date | null,
  endpoint: undefined as string | undefined
})

let checkInterval: ReturnType<typeof setInterval> | null = null

// Check AWS endpoint connectivity using the proxy
async function checkConnection(): Promise<boolean> {
  // Try to connect via proxy
  const strategies = [
    // Strategy 1: Try S3 via proxy
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/s3/', {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.type === 'opaque'
      } catch {
        return false
      }
    },
    
    // Strategy 2: Try Lambda via proxy
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/2015-03-31/functions/', {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.type === 'opaque'
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
      // Try next strategy
      continue
    }
  }

  // Mark as not connected
  connectionStatus.value = {
    ...connectionStatus.value,
    isReachable: false,
    isConnected: false,
    lastChecked: new Date()
  }
  
  return false
}

// Set endpoint URL and recheck
function setEndpoint(url: string): void {
  connectionStatus.value = {
    ...connectionStatus.value,
    endpoint: url
  }
  checkConnection()
}

// Start periodic checks
function startMonitoring(): void {
  if (checkInterval) return
  checkConnection()
  checkInterval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL)
}

// Stop periodic checks
function stopMonitoring(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

// Manual trigger for connection check
async function triggerConnectionCheck(): Promise<boolean> {
  return await checkConnection()
}

export function useConnectionStatus() {
  onMounted(() => {
    // Delay initial check to ensure settings are loaded
    setTimeout(() => {
      startMonitoring()
    }, 500)
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    status: computed(() => connectionStatus.value),
    isConnected: computed(() => connectionStatus.value.isConnected),
    isReachable: computed(() => connectionStatus.value.isReachable),
    lastChecked: computed(() => connectionStatus.value.lastChecked),
    endpoint: computed(() => connectionStatus.value.endpoint),
    checkConnection,
    triggerConnectionCheck,
    setEndpoint,
    startMonitoring,
    stopMonitoring
  }
}

// Export for direct access if needed
export { connectionStatus, checkConnection }
