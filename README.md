# MyDevStack

A modern, developer-friendly web interface for managing AWS services running locally via AWS emulators like LocalStack or MiniStack.

![Vue.js](https://img.shields.io/badge/Vue.js-3.4+-42b883?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38bdf8?style=flat&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-ea580c)

## Features

- **Dashboard** - Overview of your AWS services with quick stats
- **Service Management** - Full CRUD operations for:
  - S3 (Buckets & Objects)
  - Lambda (Functions)
  - DynamoDB (Tables, Items & Streams)
  - SQS (Queues & Messages)
  - SNS (Topics & Subscriptions)
  - IAM (Users, Roles, Groups & Policies)
  - And many more...
- **Logs** - View and filter CloudWatch logs
- **Settings** - Configure endpoint, region, and credentials
- **Dark Mode** - Support for light/dark themes

## Prerequisites

- Node.js 18+
- npm 9+
- A local AWS emulator (LocalStack, MiniStack, etc.)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/beabys/MyDevStack.git
cd MyDevStack

# Install dependencies
npm install
```

### Configuration

Copy the environment example and configure your AWS endpoint:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your AWS emulator URL:

```bash
VITE_AWS_ENDPOINT=http://localhost:4566
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Supported Services

| Service | Status | Description |
|---------|--------|-------------|
| S3 | ✅ | Buckets, Objects, Presigned URLs |
| Lambda | ✅ | Functions, Invocations |
| DynamoDB | ✅ | Tables, Items, Streams |
| SQS | ✅ | Queues, Messages |
| SNS | ✅ | Topics, Subscriptions, Publishing |
| IAM | ✅ | Users, Roles, Groups, Policies |
| KMS | ✅ | Keys, Encryption |
| Secrets Manager | ✅ | Secrets management |
| SSM | ✅ | Parameter Store |
| CloudWatch | ✅ | Logs, Metrics, Dashboards |
| EventBridge | ✅ | Event Buses, Rules, Targets |
| API Gateway | ✅ | REST APIs, HTTP APIs |
| Kinesis | ✅ | Streams, Shards |
| CloudFormation | ✅ | Stacks, Templates |
| Cognito | ✅ | User Pools, Clients |
| ElastiCache | ✅ | Cache clusters |
| RDS | ✅ | Database instances |
| Step Functions | ✅ | State machines |

## Project Structure

```
src/
├── api/                    # AWS API clients
│   ├── client.ts          # Axios client & interceptors
│   ├── services/          # Service-specific API calls
│   └── types/             # TypeScript types
├── components/            # Vue components
│   ├── common/            # Reusable UI components
│   └── layout/            # Layout components
├── composables/           # Vue composables
├── router/                # Vue Router configuration
├── stores/                # Pinia stores
├── views/                 # Page components
│   └── services/          # Service-specific views
└── App.vue               # Root component
```

## Technologies

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Heroicons** - SVG icons

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you find this project useful, please consider supporting its development:

<a href="https://www.buymeacoffee.com/beabys" target="_blank">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="150" height="40">
    <rect width="24" height="24" rx="4" fill="#FFDD00"/>
    <path d="M2.004 21.546h6.377v-1.409H5.59v-7.565h2.791v1.41h-2.79v4.744h2.204v1.41H2.004v-9.379h7.57v-1.41H2.004V21.546zm15.18-7.569c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195zm9.938-1.313c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195z" fill="#000"/>
  </svg>
</a>

**Disclaimer:** All brand names, logos, and trademarks mentioned in this document belong to their respective owners.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

---

Built with ❤️ using Vue 3 and Tailwind CSS
