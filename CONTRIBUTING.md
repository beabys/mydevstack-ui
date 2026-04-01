# Contributing to MyDevStack

Thank you for your interest in contributing to MyDevStack! This document outlines the process for contributing to this project.

## Ways to Contribute

There are many ways you can contribute:

- 🐛 **Bug Reports** - Help us identify issues
- 💡 **Feature Requests** - Suggest new features
- 🔧 **Pull Requests** - Submit code changes
- 📖 **Documentation** - Improve docs and examples
- 🌍 **Translations** - Help localize the app

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mydevstack.git
   cd mydevstack
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. Make your changes in your feature branch
2. Test your changes:
   ```bash
   npm run dev
   ```
3. Build to ensure no errors:
   ```bash
   npm run build
   ```
4. Commit your changes:
   ```bash
   git commit -m "Add feature: your feature name"
   ```
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
6. Create a Pull Request

## Code Style

- Use **TypeScript** for all new code
- Follow existing code patterns in the project
- Use meaningful variable and function names
- Comment complex logic

### Vue Component Style

```vue
<script setup lang="ts">
// Imports at top
import { ref, computed } from 'vue'

// Types (if applicable)
interface Props {
  title: string
  variant?: 'primary' | 'secondary'
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary'
})

// Emit definitions
const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

// Refs and reactive state
const isLoading = ref(false)

// Computed properties
const buttonClass = computed(() => {
  return props.variant === 'primary' ? 'btn-primary' : 'btn-secondary'
})
</script>

<template>
  <!-- Template content -->
</template>
```

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Fix bug" not "Fixes bug")
- Limit the first line to 72 characters
- Reference issues and pull requests after the first line

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass and build succeeds
3. Update the CHANGELOG.md if applicable
4. Request review from maintainers

## Recognition

Contributors will be recognized in the README.md file.

## Questions?

If you have questions, feel free to open an issue or reach out to the maintainers.

---

Thank you for contributing! 🎉
