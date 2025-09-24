// Email service for Smart Attendance System
// Environment-based email sending - AWS SES in production, mock in development

const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { generateVerificationUrl } = require("../validation/email-validation");

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isLocalStack = process.env.IS_OFFLINE || process.env.AWS_ENDPOINT;

// SES Client configuration
let sesClient = null;

if (isProduction) {
  // Production: Real AWS SES
  sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
} else if (isLocalStack) {
  // LocalStack: SES simulation (may not work perfectly)
  sesClient = new SESClient({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  });
}

// Email templates
const getVerificationEmailTemplate = (teacherName, verificationUrl) => {
  return {
    subject: "Verify Your Smart Attendance System Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            background: #28a745; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Smart Attendance System</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${teacherName}!</h2>
            <p>Thank you for registering with the Smart Attendance System. To complete your registration and activate your account, please verify your email address.</p>
            
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">✅ Verify Email Address</a>
            </p>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Click the verification button above</li>
              <li>Your account will be activated immediately</li>
              <li>You can then login and start creating classes</li>
              <li>Generate QR codes for student attendance</li>
            </ul>
            
            <p><strong>Security Note:</strong> This link will expire in 24 hours for your security.</p>
            
            <hr>
            <p><small>If you didn't create this account, please ignore this email.</small></p>
          </div>
          <div class="footer">
            <p>© 2025 Smart Attendance System</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Smart Attendance System!
      
      Hi ${teacherName},
      
      Thank you for registering. Please verify your email address by clicking this link:
      ${verificationUrl}
      
      What's next?
      - Click the verification link
      - Your account will be activated
      - Login and start creating classes
      - Generate QR codes for attendance
      
      This link expires in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      © 2025 Smart Attendance System
    `,
  };
};

// Send verification email
const sendVerificationEmail = async (email, teacherName, verificationToken) => {
  try {
    const verificationUrl = generateVerificationUrl(verificationToken);
    const template = getVerificationEmailTemplate(teacherName, verificationUrl);

    if (!isProduction && !isLocalStack) {
      // Development mode: Log email instead of sending
      console.log("\n🧪 DEVELOPMENT MODE - Email would be sent:");
      console.log("📧 To:", email);
      console.log("📝 Subject:", template.subject);
      console.log("🔗 Verification URL:", verificationUrl);
      console.log("📄 Content:", template.text);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        mode: "development",
      };
    }

    if (!sesClient) {
      throw new Error("SES client not configured");
    }

    // Send email via AWS SES
    const params = {
      Source: process.env.FROM_EMAIL || "noreply@smartattendance.edu",
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: template.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: template.html,
            Charset: "UTF-8",
          },
          Text: {
            Data: template.text,
            Charset: "UTF-8",
          },
        },
      },
    };

    const result = await sesClient.send(new SendEmailCommand(params));

    console.log("✅ Verification email sent successfully:", result.MessageId);

    return {
      success: true,
      messageId: result.MessageId,
      mode: isProduction ? "production" : "localstack",
    };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);

    return {
      success: false,
      error: error.message,
      mode: isProduction
        ? "production"
        : isLocalStack
        ? "localstack"
        : "development",
    };
  }
};

// Send password reset email (for future use)
const sendPasswordResetEmail = async (email, teacherName, resetToken) => {
  // Implementation for password reset emails
  // Similar structure to verification email
  console.log("🔄 Password reset email would be sent to:", email);
  return { success: true, messageId: `reset-${Date.now()}` };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isProduction,
  isLocalStack,
};
