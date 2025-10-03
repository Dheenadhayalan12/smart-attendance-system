# Smart Attendance System - Development Guidelines

## Code Quality Standards

### File Organization and Naming
- **Domain-driven structure**: Organize handlers by business domain (auth, classes, sessions, attendance)
- **Descriptive filenames**: Use kebab-case for files (`create-class.js`, `submit-attendance.js`)
- **Consistent exports**: Use `module.exports` for Node.js backend, ES6 exports for React frontend
- **Index files**: Use `index.js` files to centralize exports from directories

### Code Formatting Patterns
- **Consistent indentation**: 2-space indentation throughout codebase
- **Line length**: Keep lines under 80-100 characters when possible
- **Semicolons**: Use semicolons consistently in JavaScript
- **Quotes**: Use double quotes for strings in backend, single quotes in frontend
- **Trailing commas**: Include trailing commas in multi-line objects and arrays

### Variable and Function Naming
- **camelCase**: Use camelCase for variables and functions (`rollNumber`, `handleSubmitAttendance`)
- **PascalCase**: Use PascalCase for classes and React components (`Teacher`, `AttendancePage`)
- **UPPER_SNAKE_CASE**: Use for constants (`FACE_MATCH_THRESHOLD`, `JWT_SECRET`)
- **Descriptive names**: Use clear, descriptive names (`checkExistingAttendance` vs `check`)
- **Boolean prefixes**: Use `is`, `has`, `can` prefixes for boolean variables (`isActive`, `hasCamera`)

## Structural Conventions

### React Component Patterns
```javascript
// Standard component structure observed in AttendancePage.jsx
const ComponentName = () => {
  // 1. State declarations
  const [state, setState] = useState(initialValue);
  
  // 2. Custom hooks
  const { customHook } = useCustomHook();
  
  // 3. useEffect hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 4. Event handlers
  const handleEvent = () => {
    // Handler logic
  };
  
  // 5. Render logic with early returns
  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent />;
  
  // 6. Main render
  return <JSX />;
};
```

### Backend Service Patterns
```javascript
// Standard service structure observed in attendance-service.js
const { DynamoDBCommands } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// Import dependencies at top
const { dynamodb } = require("../aws/clients");

// Helper functions first
const helperFunction = async (params) => {
  try {
    // Implementation with proper error handling
  } catch (error) {
    console.error("Error in helper:", error);
    throw new Error(`Descriptive error: ${error.message}`);
  }
};

// Main exported functions
module.exports = {
  helperFunction,
  mainFunction,
};
```

### Data Model Patterns
```javascript
// Class-based models with validation (from models/index.js)
class EntityName {
  constructor(data) {
    this.id = data.id;
    this.requiredField = data.requiredField;
    this.optionalField = data.optionalField || defaultValue;
    this.timestamp = data.timestamp || new Date().toISOString();
  }
  
  // Utility methods
  toJSON() {
    const { sensitiveField, ...publicData } = this;
    return publicData;
  }
  
  // Business logic methods
  calculateSomething() {
    return this.field1 + this.field2;
  }
}
```

## Error Handling Standards

### Backend Error Handling
- **Try-catch blocks**: Wrap all async operations in try-catch
- **Descriptive errors**: Provide clear error messages with context
- **Error logging**: Use `console.error` with descriptive prefixes
- **Error propagation**: Re-throw errors with additional context when needed
- **Graceful degradation**: Return sensible defaults when possible

### Frontend Error Handling
- **State-based errors**: Use error state to display user-friendly messages
- **Loading states**: Always show loading indicators during async operations
- **Retry mechanisms**: Provide retry buttons for failed operations
- **User feedback**: Show clear success/error messages with actionable guidance

## API Design Patterns

### Request/Response Structure
```javascript
// Consistent API response format
{
  success: boolean,
  data: object | array,
  message: string,
  error?: string
}
```

### Authentication Patterns
- **JWT tokens**: Use JWT for stateless authentication
- **Token validation**: Validate tokens in middleware/handlers
- **Public endpoints**: Clearly separate authenticated vs public endpoints
- **Role-based access**: Implement teacher vs student access patterns

### Database Interaction Patterns
```javascript
// Standard DynamoDB operations pattern
const result = await dynamodb.send(
  new CommandName({
    TableName: "EntityName",
    Key: { primaryKey: value },
    // Additional parameters
  })
);
```

## AWS Integration Standards

### Client Configuration
- **Centralized clients**: Use shared AWS client instances from `utils/aws/clients.js`
- **Environment detection**: Automatically switch between AWS and LocalStack
- **Error handling**: Wrap AWS operations in try-catch blocks
- **Resource naming**: Use consistent naming patterns for AWS resources

### S3 Operations
- **Path structure**: Use consistent S3 key patterns (`faces/${studentId}.jpg`)
- **Buffer handling**: Convert base64 to Buffer for S3 uploads
- **Error handling**: Handle S3 operation failures gracefully

### DynamoDB Patterns
- **Single table per entity**: Use separate tables for each business entity
- **UUID primary keys**: Use UUID v4 for primary keys
- **Timestamps**: Include `createdAt` and `updatedAt` timestamps
- **Batch operations**: Use batch operations for multiple items when possible

## Testing and Development Patterns

### LocalStack Integration
- **Dual environment**: Support both AWS and LocalStack seamlessly
- **Setup scripts**: Use automated setup scripts for LocalStack resources
- **Configuration**: Use environment variables for endpoint switching
- **Testing**: Test against LocalStack before AWS deployment

### Development Workflow
- **Stage-based deployment**: Use local, dev, and prod stages
- **Environment variables**: Use stage-specific environment configuration
- **Offline development**: Use serverless-offline for local development
- **Resource cleanup**: Clean up resources properly in development

## Security Best Practices

### Data Protection
- **Password hashing**: Use bcrypt for password hashing
- **Sensitive data**: Never log or expose sensitive information
- **Input validation**: Validate all user inputs
- **SQL injection prevention**: Use parameterized queries

### Authentication Security
- **JWT secrets**: Use strong, environment-specific JWT secrets
- **Token expiration**: Implement appropriate token expiration times
- **Email verification**: Require email verification for new accounts
- **Rate limiting**: Implement rate limiting for authentication endpoints

## Performance Optimization

### Frontend Performance
- **Lazy loading**: Use React.lazy for code splitting
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Image optimization**: Optimize images before upload
- **Bundle size**: Monitor and optimize bundle size

### Backend Performance
- **Connection pooling**: Reuse AWS client connections
- **Caching**: Implement caching for frequently accessed data
- **Batch operations**: Use batch operations for multiple database operations
- **Async operations**: Use async/await consistently

## Documentation Standards

### Code Comments
- **Function documentation**: Document complex functions with JSDoc
- **Business logic**: Explain business rules and calculations
- **TODO comments**: Use TODO comments for future improvements
- **API documentation**: Document API endpoints and parameters

### README Standards
- **Clear structure**: Use consistent heading structure
- **Setup instructions**: Provide step-by-step setup instructions
- **Environment configuration**: Document all environment variables
- **Deployment guides**: Include deployment instructions for each environment

## Mobile and Responsive Design

### Mobile-First Approach
- **Responsive design**: Use mobile-first responsive design patterns
- **Touch interactions**: Optimize for touch interfaces
- **Camera integration**: Handle camera permissions and errors gracefully
- **Offline handling**: Provide feedback for network issues

### UI/UX Patterns
- **Loading states**: Show loading indicators for all async operations
- **Error states**: Provide clear error messages with recovery options
- **Success feedback**: Show confirmation for successful operations
- **Progressive enhancement**: Ensure basic functionality without JavaScript