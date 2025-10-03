# Smart Attendance System 🎓# smart-attendance-system

Smart Attendance System with QR codes, face recognition, and class management

A modern, serverless smart attendance system using QR codes, facial recognition, and AWS services. Features two-phase verification: initial face registration and daily face verification using Amazon Rekognition.

## 🏗️ Architecture

**Serverless Architecture**: Lambda functions + DynamoDB + S3 + Rekognition, deployed via Serverless Framework with LocalStack for development.

### Key Features

- 🔐 **JWT-based Authentication** with email verification
- 📱 **QR Code Generation** for attendance sessions
- 👤 **Face Recognition** using Amazon Rekognition
- 📊 **Real-time Attendance Tracking**
- 🌐 **Dual Environment Support** (Production AWS + LocalStack)
- 📧 **Email Notifications** via AWS SES

## 📁 Project Structure

```
src/
├── handlers/                   # Lambda function handlers
│   ├── auth/                  # Authentication domain
│   │   ├── register.js        # Teacher registration with email verification
│   │   ├── login.js           # JWT-based authentication
│   │   ├── verify-email.js    # Email verification completion
│   │   └── resend-verification.js # Resend verification email
│   ├── classes/               # Class management domain
│   │   ├── create-class.js    # Create new class with roll ranges
│   │   ├── get-classes.js     # List teacher's classes
│   │   ├── get-class.js       # Get specific class details
│   │   ├── update-class.js    # Update class information
│   │   └── delete-class.js    # Delete class
│   ├── sessions/              # Session management domain
│   │   ├── create-session.js  # Create session with QR code
│   │   ├── get-sessions.js    # List class sessions
│   │   ├── get-session.js     # Get specific session
│   │   └── end-session.js     # End active session
│   ├── students/              # Student management domain
│   │   ├── get-students.js    # Get students by class
│   │   └── get-student.js     # Get individual student
│   └── attendance/            # Attendance domain
│       ├── get-session-info.js       # Student: Get session info
│       ├── submit-attendance.js      # Student: Submit attendance
│       ├── get-session-attendance.js # Teacher: View session attendance
│       └── get-student-attendance.js # Teacher: View student history
├── utils/                     # Shared utilities
│   ├── aws/                   # AWS service clients
│   │   ├── clients.js         # Centralized AWS clients
│   │   └── s3.js             # S3 operations
│   ├── helpers/               # Utility functions
│   │   ├── jwt-helper.js      # JWT token operations
│   │   ├── api-response.js    # Standardized API responses
│   │   └── session-helpers.js # Session calculations
│   ├── validation/            # Input validation
│   │   ├── student-validation.js # Roll number validation
│   │   └── email-validation.js   # Email validation & verification
│   └── services/              # Business logic services
│       ├── face-service.js    # Amazon Rekognition operations
│       ├── attendance-service.js # Attendance workflow logic
│       └── email-service.js   # SES email sending
├── models/                    # Data models and validation
│   └── index.js              # Entity models and validators
└── config/                    # Configuration constants
    └── constants.js          # Environment-specific constants
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for LocalStack)
- AWS CLI configured (for production)

### Local Development Setup

1. **Clone and Install**

   ```bash
   git clone https://github.com/Dheenadhayalan12/smart-attendance-system.git
   cd smart-attendance-system
   npm install
   ```

2. **Start LocalStack**

   ```bash
   npm run start:localstack
   ```

3. **Setup LocalStack Resources**

   ```bash
   node scripts/setup-localstack.js
   ```

4. **Deploy to Local**

   ```bash
   npm run deploy:local
   ```

5. **Run Development Server**
   ```bash
   npm run offline
   ```

### Production Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## 🔧 Environment Configuration

### Dual Environment Pattern

- **Production**: Full AWS services (Rekognition, S3, DynamoDB, SES)
- **LocalStack**: Local development simulation at `http://localhost:4566`
- **Environment Detection**: Automatic switching based on `NODE_ENV`

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET=smart-attendance-faces

# JWT Configuration
JWT_SECRET=your-secret-key

# Email Configuration
FROM_EMAIL=noreply@smartattendance.edu
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development|production|local
```

## 📊 Database Schema

### Core Entities

- **Teachers**: `teacherId` (UUID), email, passwordHash, verification status
- **Classes**: `classId` (UUID), rollNumberRange (start/end), teacherId
- **Sessions**: `sessionId` (UUID), QR code, classId, active status
- **Students**: `rollNumber` (PK), faceDataPath (S3), rekognitionFaceId
- **Attendance**: `attendanceId` (composite), sessionId, rollNumber, verification status

## 🎯 API Endpoints

### Authentication

- `POST /auth/register` - Teacher registration
- `POST /auth/login` - Teacher login
- `POST /auth/verify-email` - Email verification
- `POST /auth/resend-verification` - Resend verification

### Class Management

- `GET /classes` - List teacher's classes
- `POST /classes` - Create new class
- `GET /classes/{id}` - Get class details
- `PUT /classes/{id}` - Update class
- `DELETE /classes/{id}` - Delete class

### Session Management

- `POST /sessions` - Create session with QR
- `GET /classes/{id}/sessions` - List class sessions
- `GET /sessions/{id}` - Get session details
- `POST /sessions/{id}/end` - End session

### Student Attendance (Public)

- `GET /api/student/session/{id}` - Get session info via QR
- `POST /api/student/attendance` - Submit attendance with face

### Attendance Reports

- `GET /sessions/{id}/attendance` - Session attendance report
- `GET /students/{id}/attendance` - Student attendance history

## 🔐 Face Recognition Workflow

1. **Student First Scan**: QR → Roll validation → Face registration → Attendance marked
2. **Subsequent Scans**: QR → Roll validation → Face verification → Attendance marked (if match ≥80%)

### Face Recognition Configuration

```javascript
const FACE_COLLECTION_ID = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80; // 80% confidence threshold
```

## 🧪 Testing

The project includes comprehensive testing capabilities:

```bash
# Test individual components (create custom test files as needed)
node -c src/handlers/auth/register.js  # Syntax check

# Test serverless configuration
npx serverless print --stage local

# Start offline development server
npm run offline
```

## 🛠️ Development Scripts

```bash
npm run start:localstack    # Start LocalStack containers
npm run stop:localstack     # Stop LocalStack containers
npm run deploy:local        # Deploy to LocalStack
npm run deploy:dev          # Deploy to AWS dev
npm run deploy:prod         # Deploy to AWS production
npm run offline             # Start serverless offline
```


## 🔧 AWS Services Used

- **Lambda**: Serverless function execution
- **DynamoDB**: NoSQL database for all entities
- **S3**: Face image storage
- **Rekognition**: Face recognition and matching
- **SES**: Email verification and notifications
- **CloudFormation**: Infrastructure as Code

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email your-email@domain.com or create an issue in this repository.

---

**Built with ❤️ using AWS Serverless Architecture**
