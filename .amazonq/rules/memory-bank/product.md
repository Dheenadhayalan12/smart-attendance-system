# Smart Attendance System - Product Overview

## Purpose
A modern serverless attendance management system that combines QR code technology with facial recognition for secure, automated student attendance tracking in educational institutions.

## Core Value Proposition
- **Dual-Phase Security**: Initial face registration followed by daily face verification using Amazon Rekognition
- **Contactless Operation**: QR code-based attendance submission eliminates physical contact
- **Real-time Tracking**: Instant attendance recording and reporting for teachers
- **Serverless Architecture**: Cost-effective, scalable AWS infrastructure with LocalStack development support

## Key Features

### Authentication & Security
- JWT-based teacher authentication with email verification
- Secure password hashing with bcrypt
- Email verification workflow via AWS SES
- Role-based access control (teachers vs students)

### Class Management
- Create and manage classes with roll number ranges
- Update class information and student enrollment
- Delete classes with proper data cleanup
- View class-specific attendance statistics

### Session Management
- Generate unique QR codes for each attendance session
- Real-time session status tracking (active/ended)
- Session-based attendance collection
- Automatic session expiration handling

### Face Recognition Workflow
- **First-time Students**: QR scan → Roll validation → Face registration → Attendance marked
- **Returning Students**: QR scan → Roll validation → Face verification (80% threshold) → Attendance marked
- Amazon Rekognition integration for face matching
- S3 storage for face image data

### Attendance Tracking
- Real-time attendance submission via mobile devices
- Session-based attendance reports for teachers
- Individual student attendance history
- Automated attendance verification using facial recognition

## Target Users

### Primary Users - Teachers
- Create and manage classes
- Generate QR codes for attendance sessions
- Monitor real-time attendance during sessions
- Generate attendance reports and analytics
- Manage student enrollment and class settings

### Secondary Users - Students
- Scan QR codes to submit attendance
- Register face data on first attendance
- Verify identity through facial recognition
- Access attendance submission interface via mobile devices

## Use Cases

### Daily Attendance Collection
1. Teacher creates attendance session and displays QR code
2. Students scan QR code with mobile devices
3. System validates roll numbers and verifies faces
4. Attendance is automatically recorded and tracked
5. Teacher monitors real-time attendance status

### Student Onboarding
1. New student scans QR code for first time
2. System prompts for roll number validation
3. Student captures face image for registration
4. Face data is stored in Amazon Rekognition collection
5. Attendance is marked for current session

### Attendance Reporting
1. Teachers access session-specific attendance reports
2. View individual student attendance history
3. Export attendance data for administrative purposes
4. Monitor attendance trends and patterns

## Technical Benefits
- **Serverless Cost Efficiency**: Pay-per-use Lambda functions
- **Scalable Storage**: DynamoDB for high-performance data access
- **Reliable Face Recognition**: AWS Rekognition with 80% confidence threshold
- **Development Flexibility**: LocalStack for offline development and testing
- **Modern Frontend**: React-based responsive web interface