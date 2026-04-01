<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionStatus } from '@/composables/useConnectionStatus'

const route = useRoute()
const settingsStore = useSettingsStore()
const { isReachable, triggerConnectionCheck } = useConnectionStatus()

const pageTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return title || 'MyDevStack'
})

const endpointDisplay = computed(() => {
  const url = settingsStore.endpoint
  try {
    const urlObj = new URL(url)
    return urlObj.host
  } catch {
    return url
  }
})
</script>

<template>
  <header
    class="h-16 border-b flex items-center justify-between px-6 sticky top-0 z-30"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <!-- Left: Page Title -->
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-semibold" :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
      <!-- Connection Status -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg" :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-light-bg'">
        <div class="relative">
          <div
            :class="[
              'w-5 h-5 rounded-full flex items-center justify-center',
              isReachable
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            ]"
          >
            <div
              :class="[
                'w-2 h-2 rounded-full',
                isReachable
                  ? 'bg-green-500 dark:bg-green-400 animate-pulse'
                  : 'bg-red-500 dark:bg-red-400'
              ]"
            />
          </div>
        </div>
        <div class="flex flex-col">
          <span
            :class="[
              'text-xs font-medium',
              isReachable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            ]"
          >
            {{ isReachable ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
        <button
          @click="triggerConnectionCheck"
          class="ml-1 p-1 rounded hover:bg-light-border dark:hover:bg-dark-border transition-colors"
          title="Refresh connection status"
        >
          <svg class="w-3.5 h-3.5" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <!-- Endpoint Badge -->
      <div
        class="px-3 py-1.5 rounded-lg text-xs font-mono"
        :class="settingsStore.darkMode ? 'bg-dark-bg text-dark-muted' : 'bg-light-bg text-light-muted'"
      >
        {{ endpointDisplay }}
      </div>

      <!-- Dark Mode Toggle -->
      <button
        @click="settingsStore.toggleDarkMode"
        class="p-2 rounded-lg transition-colors"
        :class="settingsStore.darkMode ? 'hover:bg-dark-border text-dark-muted' : 'hover:bg-light-border text-light-muted'"
        :title="settingsStore.darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <svg v-if="settingsStore.darkMode" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Notifications -->
      <button
        class="relative p-2 rounded-lg transition-colors"
        :class="settingsStore.darkMode ? 'hover:bg-dark-border text-dark-muted' : 'hover:bg-light-border text-light-muted'"
        title="Notifications"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </button>
    </div>
  </header>
</template>
