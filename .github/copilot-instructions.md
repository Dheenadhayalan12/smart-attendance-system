# Smart Attendance System – AI Agent Guide

## System Snapshot

- **Serverless architecture**: QR codes drive Lambda handlers that read/write DynamoDB tables, persist faces in S3, and validate identities with Amazon Rekognition (`src/handlers/**`, `src/utils/services/attendance-service.js`).
- **Teacher flow** (JWT protected): create classes → launch sessions with QR codes → review attendance. **Student flow** (public): scan QR → upload face image → automatic registration/verification via dual-phase face recognition.
- **DynamoDB tables** are flat (`Teachers`, `Classes`, `Sessions`, `Students`, `Attendance`) with **no stage suffix** applied—keep names consistent with `scripts/setup-localstack.js` and `serverless.yml`.
- **Attendance workflow**: First-time students are registered with face indexing; returning students are verified via Rekognition search. Both operations increment `attendanceCount` on `Students` and `Sessions` tables.

## Environment & Tooling

- **LocalStack** (`http://localhost:4566`) for local dev. `src/utils/aws/clients.js` is hard-wired to LocalStack for DynamoDB. `src/utils/aws/s3.js` switches on `NODE_ENV === "local" || IS_OFFLINE`. Rekognition (`src/utils/services/face-service.js`) **always targets real AWS**—stub or mock if offline tests needed.
- **Dev sequence**: `npm run start:localstack` → `node scripts/setup-localstack.js` → `npm run deploy:local` → `npm run offline`. Production: `npm run deploy:dev|prod`.
- **Environment variables** feed through `serverless.yml` with default fallbacks in `src/config/constants.js` (e.g., `FROM_EMAIL`, `S3_BUCKET`, `JWT_SECRET`).
- **Email verification**: Auto-verified in dev (`isProduction = false` in `email-service.js`); requires SES-sent verification link in production. Check `register.js` for the environment-based toggle.

## Lambda Handler Conventions

- **Parse `event.body`** immediately, wrap logic in try/catch, and return via `apiResponse(status, success, message, data?, error?)` from `src/utils/helpers/api-response.js` to ensure CORS headers on all responses.
- **Teacher endpoints** expect a bearer token in `Authorization` header; use `verifyToken` from `src/utils/helpers/jwt-helper.js` before touching business logic (see `handlers/classes/create-class.js`). **Student endpoints** (e.g., `/api/student/*` or attendance submission) are unauthenticated.
- **Table operations** use `@aws-sdk/lib-dynamodb` commands (`PutCommand`, `UpdateCommand`, `GetCommand`, `ScanCommand`). Re-use the shared `dynamodb` client from `src/utils/aws/clients.js`.
- **API route paths** are defined in `serverless.yml` functions section. All routes enable CORS. Teacher routes require JWT in practice but aren't configured with authorizers in serverless.yml.

## Data & Validation Rules

- **Models** in `src/models/index.js` define entity shape helpers (e.g., `Session.getAttendancePercentage()`, `Class.getExpectedStudentCount()`). Lean on them when normalizing payloads.
- **Student identifiers**: `validateRollNumber` in `src/utils/validation/student-validation.js` enforces a 10-digit numeric value (e.g., `2024179001`). Also call `validateRollNumberInRange(roll, classRange)` to enforce class membership before accepting attendance submissions.
- **Attendance writes** increment counts on both `Students` (incrementing student's `attendanceCount`) and `Sessions` (incrementing session's `attendanceCount`); mirror the `markAttendance` implementation if you add new write paths.
- **Roll number ranges**: Classes use format `"2024179001-2024179060"` for `rollNumberRange`. Parse with split("-") and validate numerically.

## Face Registration & Storage

- **Base64 images** are expected (no data URLs). `registerNewStudent` converts with `Buffer.from(faceImage, "base64")`, uploads via `uploadToS3` (`faces/${studentId}.jpg`), then indexes the face with Rekognition.
- **`face-service.js`** lazily creates the `smart-attendance-faces` collection in AWS. Re-use `indexFace`/`searchFace` helpers rather than hitting Rekognition directly.
- **Dual-phase recognition**: New students get indexed with `IndexFacesCommand` (stores face in collection with `externalImageId`). Returning students are matched via `SearchFacesByImageCommand` with `FACE_MATCH_THRESHOLD = 80`.
- If you add new media flows, keep S3 keys under the existing `faces/` prefix or update `scripts/setup-localstack.js` to provision required buckets.

## QR Code Generation

- **Session QR codes** contain frontend URLs (not raw JSON). See `create-session.js`: `QRCode.toDataURL(attendanceUrl)` where `attendanceUrl = ${FRONTEND_URL}/attendance?sessionId=${sessionId}`.
- Students scan QR → frontend extracts `sessionId` from URL → student submits attendance with face image + roll number to `/attendance/submit`.
- QR metadata (classId, rollRange, expiry) is stored separately in session's `qrData` field for backend validation during attendance submission.

## Query & Scan Patterns

- Without secondary indexes, existence checks rely on `ScanCommand` with filters (see `checkExistingAttendance` and `getExistingStudent`). Be mindful of cost and consider projecting to the same filters when introducing new access patterns.
- All DynamoDB table names are currently literals inside handlers; update both `constants.js` and Serverless/LocalStack scripts if you rename anything.

## Debug & Ops Tips

- Local validation: `node -c src/handlers/...` for syntax, `npx serverless print --stage local` to confirm env wiring.
- LocalStack logs live in the Docker container; inspect them when AWS calls silently fail.
- Rekognition isn’t emulated locally—guard code paths or provide deterministic fallbacks in tests.

## Quick References

- AWS clients: `src/utils/aws/clients.js`, `src/utils/aws/s3.js`
- Business services: `src/utils/services/attendance-service.js`, `src/utils/services/face-service.js`
- Shared helpers: `src/utils/helpers/api-response.js`, `src/utils/helpers/session-helpers.js`
- Infrastructure bootstrap: `scripts/setup-localstack.js`, `serverless.yml`
