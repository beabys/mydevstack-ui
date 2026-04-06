# MyDevStack

A modern, developer-friendly web interface for managing AWS services running locally via AWS emulators like LocalStack or MiniStack.

![Vue.js](https://img.shields.io/badge/Vue.js-3.4+-42b883?style=flat&logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38bdf8?style=flat&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-ea580c)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/beabys)

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
| API Gateway | ✅ | REST APIs, HTTP APIs |
| Kinesis | ✅ | Streams, Shards |
| CloudFormation | ✅ | Stacks, Templates |
| ElastiCache | ✅ | Cache clusters |
| RDS | ✅ | Database instances |

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

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you find this project helpful, consider buying me a coffee!

<a href="https://www.buymeacoffee.com/beabys" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.
