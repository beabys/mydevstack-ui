<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import Button from '@/components/common/Button.vue'
import Tabs from '@/components/common/Tabs.vue'
import { useToast } from '@/composables/useToast'

// Version loading - reads from VERSION file or defaults to dev
const version = ref('dev')

onMounted(async () => {
  try {
    const response = await fetch('/VERSION')
    if (response.ok) {
      const text = await response.text()
      version.value = text.trim()
    }
  } catch {
    // Use default 'dev' if VERSION file doesn't exist
  }
})

const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const toast = useToast()

// Connection form state
const endpointUrl = ref(settingsStore.endpoint)
const region = ref(settingsStore.region)
const accessKey = ref(settingsStore.accessKey)
const secretKey = ref(settingsStore.secretKey)
const showSecretKey = ref(false)
const connectionStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const connectionMessage = ref('')

// Notification state
const notificationsEnabled = ref(settingsStore.notificationsEnabled)
const soundEffectsEnabled = ref(settingsStore.soundEffectsEnabled)
const desktopNotificationsEnabled = ref(settingsStore.desktopNotificationsEnabled)

// Advanced state
const requestTimeout = ref(settingsStore.requestTimeout)
const maxRetries = ref(settingsStore.maxRetries)
const debugMode = ref(settingsStore.debugMode)

// Active tab
const activeTab = ref('connection')

// Regions
const regions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-west-3', label: 'EU (Paris)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
]

// Tab definitions
const tabs = [
  { id: 'connection', label: 'AWS Credentials' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'about', label: 'About' },
]

// Keyboard shortcuts
const keyboardShortcuts = [
  { keys: 'Ctrl + K', action: 'Open search' },
  { keys: 'Ctrl + /', action: 'Show shortcuts' },
  { keys: 'Ctrl + S', action: 'Save settings' },
  { keys: 'Ctrl + ,', action: 'Open settings' },
  { keys: 'Ctrl + B', action: 'Toggle sidebar' },
  { keys: 'Ctrl + D', action: 'Toggle dark mode' },
  { keys: 'Esc', action: 'Close modal/dialog' },
  { keys: 'Enter', action: 'Confirm action' },
  { keys: '↑ / ↓', action: 'Navigate list' },
  { keys: 'Ctrl + R', action: 'Refresh data' },
]

// Check for changes
const hasConnectionChanges = computed(() => {
  return (
    endpointUrl.value !== settingsStore.endpoint ||
    region.value !== settingsStore.region ||
    accessKey.value !== settingsStore.accessKey ||
    secretKey.value !== settingsStore.secretKey
  )
})

// Validation
const endpointError = computed(() => {
  if (!endpointUrl.value) return 'Endpoint URL is required'
  try {
    new URL(endpointUrl.value)
    return ''
  } catch {
    return 'Invalid URL format (include http:// or https://)'
  }
})

// Is local emulator mode (localhost)
const isLocalMode = computed(() => {
  try {
    const url = new URL(endpointUrl.value)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
})

// Test connection
const testConnection = async () => {
  if (endpointError.value) {
    connectionStatus.value = 'error'
    connectionMessage.value = endpointError.value
    return
  }

  connectionStatus.value = 'testing'
  connectionMessage.value = 'Testing connection...'

  try {
    // Try using fetch API directly
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(endpointUrl.value + '/', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/xml, text/xml, application/json',
      }
    })
    
    clearTimeout(timeoutId)
    
    // Check response
    if (response.ok) {
      connectionStatus.value = 'success'
      connectionMessage.value = 'Connection successful!'
      toast.success('Connection Test', 'Successfully connected to AWS endpoint.')
    } else if (response.status === 403) {
      // 403 with local endpoints usually means auth issue but service is up
      if (isLocalMode.value) {
        connectionStatus.value = 'success'
        connectionMessage.value = 'Connected (local emulator mode)'
        toast.success('Connection Test', 'Connected to local AWS emulator.')
      } else {
        connectionStatus.value = 'error'
        connectionMessage.value = 'Access denied - check your credentials'
        toast.error('Connection Failed', 'Access denied. Please check your AWS credentials.')
      }
    } else if (response.status === 301 || response.status === 302) {
      connectionStatus.value = 'success'
      connectionMessage.value = 'Endpoint reachable (redirect)'
      toast.success('Connection Test', 'AWS endpoint is reachable.')
    } else {
      connectionStatus.value = 'error'
      connectionMessage.value = `HTTP ${response.status}: ${response.statusText}`
      toast.error('Connection Failed', `HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      connectionStatus.value = 'error'
      connectionMessage.value = 'Connection timed out'
      toast.error('Connection Failed', 'Connection timed out. Please check the endpoint URL.')
    } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      connectionStatus.value = 'error'
      connectionMessage.value = 'Cannot reach endpoint'
      toast.error('Connection Failed', 'Cannot reach the endpoint. Make sure the URL is correct and the service is running.')
    } else {
      connectionStatus.value = 'error'
      connectionMessage.value = error?.message || 'Connection failed'
      toast.error('Connection Failed', error?.message || 'Failed to connect.')
    }
  }
}

// Save connection settings
const saveConnection = () => {
  settingsStore.setEndpoint(endpointUrl.value)
  settingsStore.setRegion(region.value)
  settingsStore.setCredentials(accessKey.value, secretKey.value)
  uiStore.notifySuccess('Settings saved', 'AWS credentials updated successfully.')
}

// Save advanced settings
const saveAdvanced = () => {
  settingsStore.setRequestTimeout(requestTimeout.value)
  settingsStore.setMaxRetries(maxRetries.value)
  settingsStore.debugMode = debugMode.value
  uiStore.notifySuccess('Advanced settings saved', 'Your advanced settings have been updated.')
}

// Clear local storage
const clearLocalStorage = () => {
  if (confirm('Are you sure you want to clear all settings? This will reset all preferences to defaults.')) {
    settingsStore.clearLocalStorage()
    endpointUrl.value = settingsStore.endpoint
    region.value = settingsStore.region
    accessKey.value = settingsStore.accessKey
    secretKey.value = settingsStore.secretKey
    notificationsEnabled.value = settingsStore.notificationsEnabled
    soundEffectsEnabled.value = settingsStore.soundEffectsEnabled
    desktopNotificationsEnabled.value = settingsStore.desktopNotificationsEnabled
    requestTimeout.value = settingsStore.requestTimeout
    maxRetries.value = settingsStore.maxRetries
    debugMode.value = settingsStore.debugMode
    uiStore.notifySuccess('Local storage cleared', 'All settings have been reset to defaults.')
  }
}

// Watch for settings store changes
watch(() => settingsStore.endpoint, (newVal) => {
  endpointUrl.value = newVal
})

watch(() => settingsStore.region, (newVal) => {
  region.value = newVal
})

watch(() => settingsStore.accessKey, (newVal) => {
  accessKey.value = newVal
})

watch(() => settingsStore.secretKey, (newVal) => {
  secretKey.value = newVal
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1
        class="text-2xl font-bold"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Settings
      </h1>
      <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
        Configure AWS credentials and endpoint connection
      </p>
    </div>

    <!-- Tabs -->
    <div
      class="border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <nav class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === tab.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent hover:text-gray-700 hover:border-gray-300 dark:text-dark-muted dark:hover:text-dark-text'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- AWS Credentials Tab -->
    <div
      v-if="activeTab === 'connection'"
      class="space-y-6"
    >
      <!-- AWS Credentials Card -->
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          AWS Credentials
        </h2>
        
        <div class="space-y-4 max-w-lg">
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              AWS Access Key ID
            </label>
            <input
              v-model="accessKey"
              type="text"
              placeholder="AKIAIOSFODNN7EXAMPLE"
              class="w-full px-3 py-2 rounded-lg border text-sm font-mono"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-xs mt-1"
            >
              Your AWS access key or "test" for local emulators
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              AWS Secret Access Key
            </label>
            <div class="relative">
              <input
                v-model="secretKey"
                :type="showSecretKey ? 'text' : 'password'"
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                class="w-full px-3 py-2 rounded-lg border text-sm pr-10 font-mono"
                :class="settingsStore.darkMode 
                  ? 'bg-dark-bg border-dark-border text-dark-text' 
                  : 'bg-light-bg border-light-border text-light-text'"
              >
              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                @click="showSecretKey = !showSecretKey"
              >
                {{ showSecretKey ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-xs mt-1"
            >
              Your AWS secret key or "test" for local emulators
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              AWS Region
            </label>
            <select
              v-model="region"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
              <option
                v-for="r in regions"
                :key="r.value"
                :value="r.value"
              >
                {{ r.label }} ({{ r.value }})
              </option>
            </select>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-xs mt-1"
            >
              The AWS region to use
            </p>
          </div>
        </div>
      </div>

      <!-- Endpoint Configuration Card -->
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Endpoint Configuration
        </h2>
        
        <div class="space-y-4 max-w-lg">
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Endpoint URL
            </label>
            <input
              v-model="endpointUrl"
              type="url"
              placeholder="https://dynamodb.us-east-1.amazonaws.com"
              class="w-full px-3 py-2 rounded-lg border text-sm font-mono"
              :class="[
                endpointError ? 'border-red-500' : '',
                settingsStore.darkMode 
                  ? 'bg-dark-bg border-dark-border text-dark-text' 
                  : 'bg-light-bg border-light-border text-light-text'
              ]"
            >
            <p
              v-if="endpointError"
              class="text-red-500 text-xs mt-1"
            >
              {{ endpointError }}
            </p>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-xs mt-1"
            >
              Leave empty for default AWS, or specify a custom endpoint (local emulator)
            </p>
          </div>

          <!-- Quick presets -->
          <div>
            <label
              class="block text-sm font-medium mb-2"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Quick Presets
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                class="px-3 py-1 text-xs rounded-lg border transition-colors"
                :class="settingsStore.darkMode 
                  ? 'border-dark-border text-dark-muted hover:bg-dark-border hover:text-dark-text' 
                  : 'border-light-border text-light-muted hover:bg-light-border hover:text-light-text'"
                @click="endpointUrl = 'https://dynamodb.us-east-1.amazonaws.com'"
              >
                DynamoDB (AWS)
              </button>
              <button
                class="px-3 py-1 text-xs rounded-lg border transition-colors"
                :class="settingsStore.darkMode 
                  ? 'border-dark-border text-dark-muted hover:bg-dark-border hover:text-dark-text' 
                  : 'border-light-border text-light-muted hover:bg-light-border hover:text-light-text'"
                @click="endpointUrl = 'http://localhost:4566'"
              >
                Local Emulator
              </button>
              <button
                class="px-3 py-1 text-xs rounded-lg border transition-colors"
                :class="settingsStore.darkMode 
                  ? 'border-dark-border text-dark-muted hover:bg-dark-border hover:text-dark-text' 
                  : 'border-light-border text-light-muted hover:bg-light-border hover:text-light-text'"
                @click="endpointUrl = 'http://localhost:4566'"
              >
                LocalStack (Local)
              </button>
              <button
                class="px-3 py-1 text-xs rounded-lg border transition-colors"
                :class="settingsStore.darkMode 
                  ? 'border-dark-border text-dark-muted hover:bg-dark-border hover:text-dark-text' 
                  : 'border-light-border text-light-muted hover:bg-light-border hover:text-light-text'"
                @click="endpointUrl = ''"
              >
                Clear (AWS Default)
              </button>
            </div>
          </div>

          <div class="flex items-center gap-4 pt-4">
            <button
              :disabled="connectionStatus === 'testing' || !!endpointError"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              @click="testConnection"
            >
              {{ connectionStatus === 'testing' ? 'Testing...' : 'Test Connection' }}
            </button>

            <button
              :disabled="!hasConnectionChanges"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              @click="saveConnection"
            >
              Save Credentials
            </button>
          </div>

          <!-- Connection Status -->
          <div
            v-if="connectionMessage"
            class="mt-4 p-3 rounded-lg text-sm"
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': connectionStatus === 'success',
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': connectionStatus === 'error',
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': connectionStatus === 'testing',
            }"
          >
            {{ connectionMessage }}
          </div>
        </div>
      </div>

      <!-- Local Emulator Guide -->
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h3
          class="text-lg font-semibold mb-3"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Local AWS Emulators
        </h3>
        <p
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          class="text-sm mb-4"
        >
          For local development, use emulators like MiniStack or LocalStack. Start them with Docker:
        </p>
        <div class="space-y-3">
          <div>
            <p
              class="text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              MiniStack (Recommended - Free & Open Source)
            </p>
            <div class="bg-gray-900 rounded-lg p-3 overflow-x-auto">
              <code class="text-green-400 text-xs font-mono">
                docker run --rm -p 4566:4566 ghcr.io/ministack/ministack:latest
              </code>
            </div>
          </div>
          <div>
            <p
              class="text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              LocalStack
            </p>
            <div class="bg-gray-900 rounded-lg p-3 overflow-x-auto">
              <code class="text-green-400 text-xs font-mono">
                docker run --rm -p 4566:4566 localstack/localstack
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Tab -->
    <div
      v-if="activeTab === 'advanced'"
      class="space-y-6"
    >
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Advanced
        </h2>
        
        <div class="space-y-4 max-w-lg">
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Request Timeout (seconds)
            </label>
            <input
              v-model.number="requestTimeout"
              type="number"
              min="5"
              max="300"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Max Retries
            </label>
            <input
              v-model.number="maxRetries"
              type="number"
              min="0"
              max="10"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label
                class="text-sm font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Debug Mode
              </label>
              <p
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >
                Enable detailed logging
              </p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="debugMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              @click="debugMode = !debugMode"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="debugMode ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
              @click="saveAdvanced"
            >
              Save Advanced
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-lg border p-6 border-red-200 dark:border-red-900"
        :class="settingsStore.darkMode ? 'bg-red-900/10' : 'bg-red-50'"
      >
        <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          @click="clearLocalStorage"
        >
          Clear All Settings
        </button>
      </div>
    </div>

    <!-- Shortcuts Tab -->
    <div
      v-if="activeTab === 'shortcuts'"
      class="space-y-6"
    >
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Keyboard Shortcuts
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="shortcut in keyboardShortcuts" 
            :key="shortcut.keys"
            class="flex items-center justify-between py-2"
          >
            <span
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              {{ shortcut.action }}
            </span>
            <kbd
              class="px-2 py-1 bg-gray-100 dark:bg-dark-bg rounded text-xs font-mono"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ shortcut.keys }}
            </kbd>
          </div>
        </div>
      </div>
    </div>

    <!-- About Tab -->
    <div
      v-if="activeTab === 'about'"
      class="space-y-6"
    >
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          About MyDevStack
        </h2>
        
        <div class="space-y-4">
          <div>
            <h3
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              MyDevStack
            </h3>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              Version {{ version }} - AWS Service Manager
            </p>
          </div>

          <div>
            <h3
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Supported Services
            </h3>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              S3, Lambda, DynamoDB, SQS, SNS, IAM, KMS, Secrets Manager, EventBridge, CloudWatch, Step Functions, Cognito, API Gateway, and more.
            </p>
          </div>

          <div class="pt-4 flex items-center gap-6">
            <!-- Website -->
            <a 
              href="https://alfonsorodriguez.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <img src="/me.png" alt="Website" class="w-8 h-8 rounded-full object-cover" />
              <span class="text-xs">Website</span>
            </a>
            <!-- Buy Me a Coffee -->
            <a 
              href="https://www.buymeacoffee.com/beabys" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
                <path d="M2.004 21.546h6.377v-1.409H5.59v-7.565h2.791v1.41h-2.79v4.744h2.204v1.41H2.004v-9.379h7.57v-1.41H2.004V21.546zm15.18-7.569c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195zm9.938-1.313c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195z"/>
              </svg>
              <span class="text-xs">Support</span>
            </a>
            <!-- GitHub -->
            <a 
              href="https://github.com/beabys/mydevstack" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <svg viewBox="0 0 24 24" class="w-8 h-8" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="text-xs">GitHub</span>
            </a>
          </div>
          
          <!-- Disclaimer -->
          <div class="pt-6 mt-4 border-t" :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'">
            <p class="text-xs" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
              <strong>Disclaimer:</strong> All brand names, logos, and trademarks mentioned on this page belong to their respective owners. 
              Icons used are for identification purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
