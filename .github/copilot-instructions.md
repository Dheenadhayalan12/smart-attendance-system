# Smart Attendance System - AI Coding Agent Instructions

## Project Overview

This is a serverless smart attendance system using QR codes, facial recognition, and AWS services. The system features two-phase verification: initial face registration and daily face verification using Amazon Rekognition.

**Key Architecture**: Serverless Lambda functions + DynamoDB + S3 + Rekognition, deployed via Serverless Framework with LocalStack for development.

## Essential Development Context

### Dual Environment Pattern

- **Production**: Real AWS services (Rekognition, S3, DynamoDB)
- **Local Development**: LocalStack simulation at `http://localhost:4566`
- **Handler Variants**:
  - `students.js` / `attendance.js` - Production with Rekognition
  - `students-local.js` / `attendance-local.js` - LocalStack without Rekognition

### AWS Client Configuration

All AWS clients use the shared configuration in `backend/utils/aws-clients.js`:

```javascript
// LocalStack configuration for development
const localStackConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
};
```

### Authentication Pattern

JWT-based authentication with consistent pattern across handlers:

```javascript
const verifyToken = (token) => {
  return jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
};
```

Use the helper from `backend/utils/helpers.js` for token verification and API responses.

## Critical File Structure

```
backend/
├── handlers/           # Lambda function handlers
│   ├── auth.js        # Teacher login/register
│   ├── classes.js     # Class CRUD operations
│   ├── sessions.js    # Session management with QR codes
│   ├── students.js    # Student registration (production)
│   ├── students-local.js  # Student registration (local dev)
│   ├── attendance.js  # Face verification attendance (production)
│   └── attendance-local.js # Attendance without face verification
└── utils/
    ├── aws-clients.js # Shared AWS service clients
    └── helpers.js     # JWT, validation, API response utilities
```

## Database Schema & Business Logic

### Core Entities

- **Teachers**: `teacherId` (UUID), email, passwordHash
- **Classes**: `classId` (UUID), rollNumberRange (start/end), teacherId
- **Sessions**: `sessionId` (UUID), QR code, classId, active status
- **Students**: `rollNumber` (PK), faceDataPath (S3), rekognitionFaceId
- **Attendance**: `attendanceId` (composite), sessionId, rollNumber, verificationStatus

### Roll Number Validation Pattern

```javascript
// Example: 21CS001 format validation
const validateRollNumber = (rollNumber) => {
  const rollRegex = /^[0-9]{2}[A-Z]{2}[0-9]{3}$/;
  return rollRegex.test(rollNumber);
};
```

## Development Workflows

### Local Development Setup

```bash
# Start LocalStack
npm run start:localstack

# Setup LocalStack resources
node scripts/setup-localstack.js

# Deploy to local
npm run deploy:local

# Run serverless offline
npm run offline
```

### Testing Strategy

- `test-complete-system.js` - Full flow with Rekognition
- `test-local-system.js` - LocalStack without face recognition
- `test-auth.js` - Authentication flow testing
- `test-class-management.js` - Class CRUD operations

### Face Recognition Integration

Production uses Amazon Rekognition with face collection management:

```javascript
const FACE_COLLECTION_ID = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80;
```

## Serverless Framework Patterns

### Function Definition Pattern

```yaml
functions:
  functionName:
    handler: backend/handlers/module.functionName
    events:
      - http:
          path: api/endpoint
          method: post
          cors: true
```

### Resource Naming Convention

- DynamoDB tables: `Teachers`, `Classes`, `Sessions`, `Students`, `Attendance`
- S3 bucket: `smart-attendance-faces`
- Environment variables: `DYNAMODB_TABLE_PREFIX`, `S3_BUCKET`

## Integration Points

### QR Code Flow

1. Teacher starts session → generates unique QR with sessionId
2. Student scans QR → validates rollNumber against class range
3. First scan: Face registration + attendance marking
4. Subsequent scans: Face verification → attendance if match succeeds

### API Response Pattern

Use consistent response format from `helpers.js`:

```javascript
return apiResponse(200, true, "Success message", data);
return apiResponse(400, false, "Error message", null, error);
```

## Common Patterns to Follow

1. **Error Handling**: Always return proper HTTP status codes with CORS headers
2. **Token Validation**: Extract from `Authorization` or `authorization` headers
3. **UUID Generation**: Use `uuid` package for all entity IDs
4. **Environment Switching**: Check for LocalStack vs production AWS endpoints
5. **Face Data Storage**: S3 for images, Rekognition for face indexing
6. **Attendance Logic**: Two-phase verification (register → verify)

## Key Dependencies

- `@aws-sdk/client-*` - AWS SDK v3 clients
- `serverless-localstack` - Local development plugin
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `qrcode` - QR code generation
- `uuid` - Unique ID generation

When working on this project, prioritize understanding the dual environment setup (LocalStack vs AWS) and the two-phase attendance verification flow, as these are the core architectural decisions that affect all development work.
