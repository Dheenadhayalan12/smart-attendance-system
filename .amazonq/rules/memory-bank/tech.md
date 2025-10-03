# Smart Attendance System - Technology Stack

## Programming Languages
- **Backend**: Node.js 18.x (CommonJS modules)
- **Frontend**: JavaScript/JSX with React
- **Configuration**: YAML (serverless.yml), JSON (package.json)

## Backend Technology Stack

### Core Framework
- **Serverless Framework 4.19.1**: Infrastructure as Code and deployment
- **AWS Lambda**: Serverless function execution (Node.js 18.x runtime)
- **serverless-offline 14.4.0**: Local development server

### AWS Services Integration
- **AWS SDK v3**: Modern AWS service clients
  - `@aws-sdk/client-dynamodb ^3.893.0`: DynamoDB operations
  - `@aws-sdk/lib-dynamodb ^3.893.0`: DynamoDB document client
  - `@aws-sdk/client-s3 ^3.893.0`: S3 file storage
  - `@aws-sdk/client-rekognition ^3.893.0`: Face recognition
  - `@aws-sdk/client-ses ^3.895.0`: Email services
- **aws-sdk ^2.1692.0**: Legacy SDK for compatibility

### Authentication & Security
- **jsonwebtoken ^9.0.2**: JWT token generation and verification
- **bcryptjs ^3.0.2**: Password hashing and verification
- **bcrypt ^6.0.0**: Alternative password hashing library

### Utilities & Libraries
- **uuid ^13.0.0**: Unique identifier generation
- **qrcode ^1.5.4**: QR code generation for attendance sessions

### Development Environment
- **LocalStack Integration**:
  - `serverless-localstack ^1.3.1`: LocalStack plugin for Serverless
  - `localstack ^1.0.0`: Local AWS service emulation
- **Docker Compose**: LocalStack containerization
- **Jest ^30.1.3**: Testing framework

## Frontend Technology Stack

### Core Framework
- **React**: Component-based UI library
- **Vite**: Modern build tool and development server
- **JSX**: React component syntax

### Build Tools
- **Vite**: Fast build tool with HMR (Hot Module Replacement)
- **ESLint**: Code linting and style enforcement
- **npm**: Package management

## Database & Storage

### Primary Database
- **Amazon DynamoDB**: NoSQL database for all entities
  - Tables: Teachers, Classes, Sessions, Students, Attendance
  - Provisioned throughput: 5 read/write capacity units per table
  - Single-table design per entity

### File Storage
- **Amazon S3**: Face image storage
  - Bucket: `smart-attendance-faces`
  - Versioning enabled
  - Public access blocked for security

### Face Recognition
- **Amazon Rekognition**: Face detection and matching
  - Face collection: `smart-attendance-faces`
  - Confidence threshold: 80%
  - Face indexing and search capabilities

## Infrastructure & Deployment

### Cloud Infrastructure
- **AWS CloudFormation**: Infrastructure as Code via Serverless Framework
- **AWS Lambda**: Function execution environment
- **AWS API Gateway**: REST API endpoints with CORS
- **AWS IAM**: Role-based permissions for Lambda functions

### Development Infrastructure
- **LocalStack**: Local AWS service emulation
  - DynamoDB Local
  - S3 Local
  - Lambda Local
  - SES Local (email simulation)

### Deployment Stages
- **Local**: LocalStack development environment
- **Development**: AWS development stage
- **Production**: AWS production stage

## Development Commands

### LocalStack Development
```bash
npm run start:localstack    # Start LocalStack containers
npm run stop:localstack     # Stop LocalStack containers
node scripts/setup-localstack.js  # Setup LocalStack resources
```

### Serverless Deployment
```bash
npm run deploy:local        # Deploy to LocalStack
npm run deploy:dev          # Deploy to AWS development
npm run deploy:prod         # Deploy to AWS production
npm run offline             # Start local development server
```

### Testing & Debugging
```bash
npm test                    # Run Jest tests
npm run logs                # View serverless function logs
serverless print --stage local  # Validate serverless configuration
```

## Environment Configuration

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET=smart-attendance-system-{stage}-storage
DYNAMODB_TABLE_PREFIX=smart-attendance-system-{stage}

# Application Configuration
FRONTEND_URL=http://localhost:3000
FROM_EMAIL=noreply@smartattendance.edu
NODE_ENV=development|production|local

# JWT Configuration
JWT_SECRET=your-secret-key
```

### Stage-Specific Configuration
- **Local Stage**: Uses LocalStack at `http://localhost:4566`
- **Development Stage**: Uses AWS services in development account
- **Production Stage**: Uses AWS services in production account

## Security & Permissions

### IAM Permissions
- **DynamoDB**: Query, Scan, GetItem, PutItem, UpdateItem, DeleteItem
- **S3**: GetObject, PutObject, DeleteObject on face images bucket
- **Rekognition**: Full access for face operations
- **SES**: SendEmail, SendRawEmail, VerifyEmailIdentity

### CORS Configuration
- All API endpoints configured with CORS enabled
- Supports cross-origin requests from frontend application
- Preflight request handling for complex requests

## Performance & Scalability

### Lambda Configuration
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Memory**: Default (1008 MB)
- **Concurrent Executions**: AWS default limits

### Database Performance
- **DynamoDB**: Provisioned throughput model
- **Read/Write Capacity**: 5 units per table (adjustable)
- **Auto-scaling**: Can be enabled for production workloads

### Storage Optimization
- **S3**: Versioning enabled for face images
- **Face Data**: Stored as Rekognition face vectors (not raw images)
- **QR Codes**: Generated dynamically (not stored)