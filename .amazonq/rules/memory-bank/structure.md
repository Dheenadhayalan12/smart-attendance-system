# Smart Attendance System - Project Structure

## Root Directory Organization

```
smart-attendance-system/
├── src/                    # Backend serverless functions
├── frontend/              # React web application
├── scripts/               # Setup and utility scripts
├── infrastructure/        # LocalStack configuration
├── .serverless/          # Serverless deployment artifacts
├── volume/               # LocalStack persistent data
└── Configuration files
```

## Backend Structure (`src/`)

### Domain-Driven Organization
```
src/
├── handlers/              # Lambda function handlers (by domain)
│   ├── auth/             # Authentication domain
│   │   ├── register.js   # Teacher registration + email verification
│   │   ├── login.js      # JWT authentication
│   │   ├── verify-email.js # Email verification completion
│   │   └── resend-verification.js # Resend verification email
│   ├── classes/          # Class management domain
│   │   ├── create-class.js # Create class with roll ranges
│   │   ├── get-classes.js  # List teacher's classes
│   │   ├── get-class.js    # Get specific class details
│   │   ├── update-class.js # Update class information
│   │   └── delete-class.js # Delete class
│   ├── sessions/         # Session management domain
│   │   ├── create-session.js # Create session + QR code
│   │   ├── get-sessions.js   # List class sessions
│   │   ├── get-session.js    # Get specific session
│   │   └── end-session.js    # End active session
│   ├── students/         # Student management domain
│   │   ├── get-students.js # Get students by class
│   │   └── get-student.js  # Get individual student
│   └── attendance/       # Attendance domain
│       ├── get-session-info.js       # Student: Get session info
│       ├── submit-attendance.js      # Student: Submit attendance
│       ├── get-session-attendance.js # Teacher: View session attendance
│       └── get-student-attendance.js # Teacher: View student history
├── utils/                # Shared utilities and services
│   ├── aws/             # AWS service clients
│   │   ├── clients.js   # Centralized AWS SDK clients
│   │   └── s3.js        # S3 operations wrapper
│   ├── helpers/         # Utility functions
│   │   ├── jwt-helper.js      # JWT token operations
│   │   ├── api-response.js    # Standardized API responses
│   │   └── session-helpers.js # Session calculations
│   ├── validation/      # Input validation
│   │   ├── student-validation.js # Roll number validation
│   │   └── email-validation.js   # Email validation & verification
│   └── services/        # Business logic services
│       ├── face-service.js       # Amazon Rekognition operations
│       ├── attendance-service.js # Attendance workflow logic
│       └── email-service.js      # SES email sending
├── models/              # Data models and validation
│   └── index.js        # Entity models and validators
└── config/             # Configuration constants
    └── constants.js    # Environment-specific constants
```

## Frontend Structure (`frontend/`)

### React Application Organization
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-based page components
│   │   ├── auth/       # Authentication pages
│   │   ├── teacher/    # Teacher dashboard pages
│   │   └── student/    # Student attendance pages
│   ├── services/       # API service layer
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Frontend utilities
│   ├── styles/         # CSS and styling
│   └── assets/         # Static assets
├── public/             # Public static files
└── Configuration files (package.json, vite.config.js, etc.)
```

## Core Architectural Patterns

### Serverless Lambda Architecture
- **Handler Pattern**: Each Lambda function has a dedicated handler file
- **Domain Separation**: Functions organized by business domain (auth, classes, sessions, etc.)
- **Shared Utilities**: Common functionality extracted to `utils/` directory
- **Environment Abstraction**: Dual support for AWS and LocalStack environments

### Data Layer Architecture
- **DynamoDB Tables**: One table per entity (Teachers, Classes, Sessions, Students, Attendance)
- **S3 Storage**: Face images stored in dedicated S3 bucket
- **Rekognition Collection**: Face data managed in AWS Rekognition collection
- **Composite Keys**: Attendance uses composite keys for efficient querying

### API Design Patterns
- **RESTful Endpoints**: Standard HTTP methods and resource-based URLs
- **CORS Enabled**: All endpoints configured for cross-origin requests
- **JWT Authentication**: Token-based authentication for teacher endpoints
- **Public Student Endpoints**: No authentication required for student attendance submission

### Service Layer Architecture
```
Controllers (handlers/) → Services (utils/services/) → AWS Clients (utils/aws/) → AWS Services
```

### Configuration Management
- **Environment Variables**: Stage-specific configuration via serverless.yml
- **Constants File**: Centralized configuration constants
- **Dual Environment**: Automatic switching between AWS and LocalStack based on NODE_ENV

## Key Relationships

### Teacher → Classes → Sessions → Attendance
- Teachers create and manage multiple classes
- Each class can have multiple attendance sessions
- Sessions generate QR codes for student attendance
- Attendance records link students to specific sessions

### Students → Face Recognition → Attendance
- Students register face data on first attendance
- Subsequent attendance requires face verification
- Face matching uses 80% confidence threshold
- Attendance workflow handles both registration and verification

### Frontend → Backend API Integration
- React frontend consumes REST API endpoints
- JWT tokens stored and managed in frontend
- Real-time updates for attendance monitoring
- Mobile-responsive design for student QR scanning

## Development Infrastructure

### LocalStack Integration
- **Local Development**: Full AWS service simulation
- **Docker Compose**: Containerized LocalStack environment
- **Setup Scripts**: Automated resource provisioning
- **Dual Deployment**: Same codebase works with AWS and LocalStack

### Build and Deployment
- **Serverless Framework**: Infrastructure as Code
- **Multi-Stage**: Development, staging, and production environments
- **Offline Development**: serverless-offline plugin for local testing
- **CI/CD Ready**: GitHub repository with deployment scripts