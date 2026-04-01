<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

interface Service {
  name: string
  path: string
  icon: string
  color: string
}

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const services: Service[] = [
  { name: 'S3', path: '/services/s3', icon: 's3', color: 'service-s3' },
  { name: 'Lambda', path: '/services/lambda', icon: 'lambda', color: 'service-lambda' },
  { name: 'DynamoDB', path: '/services/dynamodb', icon: 'dynamodb', color: 'service-dynamodb' },
  { name: 'SQS', path: '/services/sqs', icon: 'sqs', color: 'service-sqs' },
  { name: 'SNS', path: '/services/sns', icon: 'sns', color: 'service-sns' },
  // { name: 'IAM', path: '/services/iam', icon: 'iam', color: 'service-iam' },
  { name: 'KMS', path: '/services/kms', icon: 'kms', color: 'service-kms' },
  { name: 'Secrets', path: '/services/secrets-manager', icon: 'secrets', color: 'service-secretsmanager' },
  { name: 'EventBridge', path: '/services/eventbridge', icon: 'events', color: 'service-eventbridge' },
  { name: 'CloudWatch', path: '/services/cloudwatch', icon: 'cloudwatch', color: 'service-cloudwatch' },
  { name: 'Step Functions', path: '/services/step-functions', icon: 'steps', color: 'service-stepfunctions' },
  { name: 'Cognito', path: '/services/cognito', icon: 'cognito', color: 'service-cognito' },
  { name: 'API Gateway', path: '/services/api-gateway', icon: 'apigateway', color: 'service-apigateway' },
  { name: 'Kinesis', path: '/services/kinesis', icon: 'kinesis', color: 'service-kinesis' },
  // { name: 'CloudFormation', path: '/services/cloudformation', icon: 'cloudformation', color: 'service-cloudformation' },
  { name: 'SSM', path: '/services/ssm', icon: 'ssm', color: 'service-ssm' },
  { name: 'ElastiCache', path: '/services/elasticache', icon: 'elasticache', color: 'service-elasticache' },
  { name: 'RDS', path: '/services/rds', icon: 'rds', color: 'service-rds' },
]

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'home' },
  { name: 'Settings', path: '/settings', icon: 'cog' },
  { name: 'Logs', path: '/logs', icon: 'document' },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const isServiceRoute = computed(() => route.path.startsWith('/services'))

const handleServiceClick = (service: Service) => {
  router.push(service.path)
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-screen z-40 transition-all duration-300"
    :class="[
      collapsed ? 'w-16' : 'w-64',
      settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border',
      'border-r'
    ]"
  >
    <!-- Logo -->
    <div
      class="h-16 flex items-center justify-between px-4 border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <router-link
        to="/"
        class="flex items-center gap-3"
      >
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <svg
            class="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <span
          v-if="!collapsed"
          class="font-semibold text-lg"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          MyDevStack
        </span>
      </router-link>
      <button
        class="p-1.5 rounded-lg transition-colors"
        :class="settingsStore.darkMode ? 'hover:bg-dark-border text-dark-muted' : 'hover:bg-light-border text-light-muted'"
        @click="emit('toggle')"
      >
        <svg
          class="w-5 h-5 transition-transform"
          :class="{ 'rotate-180': collapsed }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
    </div>

    <!-- Main Navigation -->
    <nav class="p-2 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
        :class="[
          isActive(item.path)
            ? 'bg-primary-600 text-white'
            : settingsStore.darkMode
              ? 'text-dark-muted hover:bg-dark-border hover:text-dark-text'
              : 'text-light-muted hover:bg-light-border hover:text-light-text'
        ]"
      >
        <svg
          class="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <template v-if="item.icon === 'home'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </template>
          <template v-else-if="item.icon === 'server'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </template>
          <template v-else-if="item.icon === 'cog'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </template>
          <template v-else-if="item.icon === 'document'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </template>
        </svg>
        <span
          v-if="!collapsed"
          class="font-medium"
        >{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- Services List (always visible) -->
    <div
      v-if="!collapsed"
      class="mt-4 px-2"
    >
      <div
        class="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        AWS Services
      </div>
      <div class="space-y-0.5 max-h-[calc(100vh-300px)] overflow-y-auto">
        <button
          v-for="service in services"
          :key="service.path"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
          :class="[
            route.path === service.path
              ? 'bg-primary-600/10 text-primary-600'
              : settingsStore.darkMode
                ? 'text-dark-muted hover:bg-dark-border hover:text-dark-text'
                : 'text-light-muted hover:bg-light-border hover:text-light-text'
          ]"
          @click="handleServiceClick(service)"
        >
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="'bg-' + service.color"
          />
          <span class="text-sm font-medium">{{ service.name }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
