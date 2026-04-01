<script setup lang="ts">
import { computed } from 'vue'

type Status = 'active' | 'inactive' | 'pending' | 'error' | 'warning' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  status: Status
  size?: Size
  label?: string
  showDot?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDot: true,
  pulse: true,
})

const statusConfig = computed(() => {
  const configs: Record<Status, { color: string; bgColor: string; dotColor: string; text: string }> = {
    active: {
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      dotColor: 'bg-emerald-500',
      text: 'Active',
    },
    inactive: {
      color: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      dotColor: 'bg-gray-400',
      text: 'Inactive',
    },
    pending: {
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      dotColor: 'bg-amber-500',
      text: 'Pending',
    },
    error: {
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      dotColor: 'bg-red-500',
      text: 'Error',
    },
    warning: {
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      dotColor: 'bg-orange-500',
      text: 'Warning',
    },
    success: {
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      dotColor: 'bg-emerald-500',
      text: 'Success',
    },
  }
  return configs[props.status]
})

const sizeClasses = computed(() => {
  const sizes: Record<Size, { container: string; dot: string; text: string }> = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      dot: 'h-1.5 w-1.5',
      text: 'text-xs',
    },
    md: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      dot: 'h-2 w-2',
      text: 'text-xs',
    },
    lg: {
      container: 'px-3 py-1.5 text-sm gap-2',
      dot: 'h-2.5 w-2.5',
      text: 'text-sm',
    },
  }
  return sizes[props.size]
})

const shouldPulse = computed(() => {
  return props.pulse && (props.status === 'pending' || props.status === 'warning')
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded-full',
      statusConfig.bgColor,
      statusConfig.color,
      sizeClasses.container,
    ]"
  >
    <span
      v-if="showDot"
      :class="[
        'rounded-full flex-shrink-0',
        statusConfig.dotColor,
        sizeClasses.dot,
        { 'animate-pulse': shouldPulse },
      ]"
    />
    <span :class="sizeClasses.text">
      {{ label || statusConfig.text }}
    </span>
  </span>
</template>
