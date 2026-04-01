<script setup lang="ts">
/**
 * AppHeader.vue - Top header bar component
 * 
 * Provides:
 * - Current page title
 * - Connection status badge
 * - Theme toggle button (dark/light)
 * - Notification bell with dropdown
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConnectionStatus } from '@/composables/useConnectionStatus'
import { searchServices } from '@/composables/useServices'
import type { Service, AppNotification } from '@/types/services'

// Props
defineProps<{
  isDark: boolean
}>()

const emit = defineEmits<{
  'toggle-mobile-sidebar': []
  'toggle-theme': []
}>()

// Route
const route = useRoute()

// Connection status
const { isReachable, endpoint, setEndpoint } = useConnectionStatus()

// Search state
const searchQuery = ref('')
const searchResults = ref<Service[]>([])
const isSearchFocused = ref(false)
const showSearchResults = ref(false)

// Notifications state
const notifications = ref<AppNotification[]>([
  {
    id: '1',
    title: 'New Lambda Function',
    message: 'A new Lambda function was deployed successfully',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5)
  },
  {
    id: '2',
    title: 'RDS Maintenance',
    message: 'Scheduled maintenance for RDS instance in 2 hours',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: '3',
    title: 'SQS Queue Alert',
    message: 'Message count exceeded threshold for production-queue',
    type: 'error',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60)
  }
])
const showNotifications = ref(false)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// Endpoint edit state
const showEndpointInput = ref(false)
const endpointInput = ref('')
const showEndpointDropdown = ref(false)

// Page title based on route
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/settings': 'Settings',
    '/logs': 'Logs'
  }
  
  // Check exact match
  if (titles[route.path]) return titles[route.path]
  
  // Check service routes
  if (route.path.startsWith('/services/')) {
    const serviceId = route.path.split('/').pop()
    if (serviceId) {
      return serviceId.charAt(0).toUpperCase() + serviceId.slice(1).replace(/-/g, ' ')
    }
  }
  
  return 'MyDevStack'
})

// Search handling
watch(searchQuery, (query) => {
  if (query.trim()) {
    searchResults.value = searchServices(query).slice(0, 5)
    showSearchResults.value = true
  } else {
    searchResults.value = []
    showSearchResults.value = false
  }
})

// Close search results when clicking outside
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSearchResults.value = false
    isSearchFocused.value = false
  }
  if (!target.closest('.notifications-container')) {
    showNotifications.value = false
  }
  if (!target.closest('.endpoint-container')) {
    showEndpointDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  endpointInput.value = endpoint.value || ''
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Mark notification as read
function markAsRead(id: string): void {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

// Mark all as read
function markAllAsRead(): void {
  notifications.value.forEach(n => n.read = true)
}

// Clear all notifications
function clearAll(): void {
  notifications.value = []
}

// Format timestamp
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Get notification icon
function getNotificationIcon(type: AppNotification['type']): string {
  const icons = {
    info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`
  }
  return icons[type]
}

// Get notification color classes
function getNotificationClasses(type: AppNotification['type']): string {
  const classes = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  }
  return classes[type]
}

// Save endpoint
function saveEndpoint(): void {
  setEndpoint(endpointInput.value)
  showEndpointInput.value = false
  showEndpointDropdown.value = false
}

// Cancel endpoint edit
function cancelEndpointEdit(): void {
  endpointInput.value = endpoint.value || ''
  showEndpointInput.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
      <!-- Left Section: Mobile Menu + Page Title -->
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Toggle -->
        <button
          @click="emit('toggle-mobile-sidebar')"
          class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <!-- Page Title -->
        <h1 class="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
          {{ pageTitle }}
        </h1>
      </div>

      <!-- Center Section: Search Bar -->
      <div class="hidden md:block flex-1 max-w-xl mx-4">
        <div class="relative search-container">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
            @focus="isSearchFocused = true"
            :class="[
              'w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg',
              'text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
              'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none',
              'transition-all duration-200'
            ]"
          />

          <!-- Search Results Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showSearchResults && searchResults.length > 0"
              class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div class="py-2">
                <RouterLink
                  v-for="result in searchResults"
                  :key="result.id"
                  :to="result.route"
                  @click="searchQuery = ''; showSearchResults = false"
                  class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ result.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {{ result.category }}
                    </p>
                  </div>
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="flex items-center gap-2 lg:gap-4">
        <!-- Endpoint Display/Edit -->
        <div class="hidden lg:block relative endpoint-container">
          <button
            @click="showEndpointDropdown = !showEndpointDropdown"
            :class="[
              'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
              'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <span class="max-w-[150px] truncate">
              {{ endpoint || 'No endpoint' }}
            </span>
          </button>

          <!-- Endpoint Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showEndpointDropdown"
              class="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div class="p-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MyDevStack Endpoint URL
                </label>
                <input
                  v-if="showEndpointInput"
                  v-model="endpointInput"
                  type="url"
                  placeholder="http://localhost:4566"
                  class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  @keyup.enter="saveEndpoint"
                  @keyup.escape="cancelEndpointEdit"
                />
                <p v-else class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {{ endpoint || 'No endpoint configured' }}
                </p>
                <div class="flex gap-2">
                  <template v-if="showEndpointInput">
                    <button
                      @click="saveEndpoint"
                      class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      @click="cancelEndpointEdit"
                      class="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click="showEndpointInput = true; endpointInput = endpoint || ''"
                      class="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      {{ endpoint ? 'Edit' : 'Set Endpoint' }}
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Connection Status Badge -->
        <div
          :class="[
            'hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full',
            'border transition-colors',
            isReachable
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          ]"
        >
          <span
            :class="[
              'w-2 h-2 rounded-full',
              isReachable ? 'bg-green-500 dark:bg-green-400 animate-pulse' : 'bg-red-500 dark:bg-red-400'
            ]"
          />
          {{ isReachable ? 'Connected' : 'Disconnected' }}
        </div>

        <!-- Theme Toggle -->
        <button
          @click="emit('toggle-theme')"
          :class="[
            'p-2 rounded-lg transition-colors',
            'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          ]"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <!-- Sun icon (shown in dark mode) -->
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
          <!-- Moon icon (shown in light mode) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        </button>

        <!-- Notifications -->
        <div class="relative notifications-container">
          <button
            @click="showNotifications = !showNotifications"
            :class="[
              'relative p-2 rounded-lg transition-colors',
              'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <!-- Unread Badge -->
            <span
              v-if="unreadCount > 0"
              class="absolute top-1 right-1 w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Notifications Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showNotifications"
              class="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <div class="flex gap-2">
                  <button
                    v-if="notifications.length > 0"
                    @click="markAllAsRead"
                    class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                  <button
                    v-if="notifications.length > 0"
                    @click="clearAll"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <!-- Notifications List -->
              <div class="max-h-96 overflow-y-auto">
                <div v-if="notifications.length === 0" class="py-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mx-auto text-gray-400 mb-2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <p class="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                </div>

                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  :class="[
                    'relative px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                  ]"
                  @click="markAsRead(notification.id)"
                >
                  <div class="flex gap-3">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        getNotificationClasses(notification.type)
                      ]"
                      v-html="getNotificationIcon(notification.type)"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ notification.title }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {{ notification.message }}
                      </p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {{ formatTime(notification.timestamp) }}
                      </p>
                    </div>
                    <!-- Unread indicator -->
                    <div
                      v-if="!notification.read"
                      class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Line clamp for messages */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
