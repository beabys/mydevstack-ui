<script setup lang="ts">
/**
 * AppLayout.vue - Main layout wrapper component
 * 
 * Provides responsive sidebar + content layout with dark/light theme support.
 * Uses AppSidebar and AppHeader components, provides slot for main content.
 */
import { ref, provide, computed, watch } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useTheme } from '@/composables/useTheme'

// Theme support
const { isDark, toggleTheme } = useTheme()

// Sidebar state
const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)

// Provide sidebar state to children
provide('isSidebarCollapsed', computed(() => isSidebarCollapsed.value))
provide('isMobileSidebarOpen', computed(() => isMobileSidebarOpen.value))

// Toggle sidebar collapse state
function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// Toggle mobile sidebar
function toggleMobileSidebar(): void {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

// Close mobile sidebar
function closeMobileSidebar(): void {
  isMobileSidebarOpen.value = false
}

// Watch for mobile sidebar state to prevent body scroll
watch(isMobileSidebarOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Expose methods for header to use
provide('toggleMobileSidebar', toggleMobileSidebar)
provide('toggleSidebar', toggleSidebar)
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200"
  >
    <!-- Mobile Sidebar Overlay -->
    <Transition name="fade">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-40 bg-black/50 lg:hidden"
        @click="closeMobileSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <AppSidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileSidebarOpen"
      @toggle="toggleSidebar"
      @close-mobile="closeMobileSidebar"
    />

    <!-- Main Content Area -->
    <div
      class="transition-all duration-300"
      :class="[
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      ]"
    >
      <!-- Header -->
      <AppHeader
        @toggle-mobile-sidebar="toggleMobileSidebar"
        @toggle-theme="toggleTheme"
        :is-dark="isDark"
      />

      <!-- Main Content Slot -->
      <main class="p-4 lg:p-6 min-h-[calc(100vh-64px)]">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
