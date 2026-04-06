# AWS Proxy Server

A simple Go proxy server to bypass CORS issues when accessing LocalStack/AWS from a browser-based Vue application.

## Why do I need this?

When your Vue app runs in a browser and tries to make direct HTTP requests to LocalStack or AWS, you'll encounter CORS (Cross-Origin Resource Sharing) errors because:

1. Browsers enforce CORS security policies
2. LocalStack/AWS doesn't send the required CORS headers by default

This proxy server sits between your Vue app and AWS, handling the requests server-side where CORS doesn't apply.

## Running the Proxy

```bash
# From the server directory
cd server

# Copy .env.example to .env and adjust if needed
cp .env.example .env

# Build the proxy
go build -o proxy .

# Run the proxy
./proxy
```

The proxy will start on `http://localhost:8081` by default.

## Configuring Your Vue App

In your Vue app settings, change the AWS endpoint from `http://localhost:4566` to the proxy URL:

```
http://localhost:8081
```

Now your Vue app will connect to the proxy, which forwards requests to LocalStack.

## Supported Services

- Lambda (`/lambda/*`)
- S3 (`/s3/*`)
- DynamoDB (`/dynamodb/*`)
- SQS (`/sqs/*`)
- SNS (`/sns/*`)
- IAM (`/iam/*`)
- KMS (`/kms/*`)
- Secrets Manager (`/secretsmanager/*`)
- EventBridge (`/events/*`)
- API Gateway (`/apigateway/*`)
- Kinesis (`/kinesis/*`)
- CloudFormation (`/cloudformation/*`)
- SSM (`/ssm/*`)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PROXY_PORT | 8081 | Proxy server port |
| AWS_ENDPOINT | http://localhost:4566 | Target AWS endpoint |
| AWS_REGION | us-east-1 | AWS region |
| AWS_ACCESS_KEY | test | AWS access key |
| AWS_SECRET_KEY | test | AWS secret key |

## Production Usage

For production deployments, consider:

1. **Adding proper AWS Signature V4 signing** - the current implementation uses basic auth which works with LocalStack but not real AWS
2. **Adding TLS/SSL** - run behind nginx with HTTPS
3. **Rate limiting** - add middleware to prevent abuse
4. **Authentication** - add API key or JWT validation
