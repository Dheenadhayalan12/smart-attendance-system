// Email validation utilities for the smart attendance system
// Environment-based email validation - strict in production, lenient in development

const crypto = require("crypto");

// Basic email format validation
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate email domain - block fake/temporary domains in production
const validateEmailDomain = (email) => {
  // Only apply strict domain validation in production
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    // Development/LocalStack: Allow any domain for testing
    return true;
  }

  // Production: Block fake/temporary email domains
  const fakeDomains = [
    // Test domains
    "test.com",
    "example.com",
    "fake.com",
    "temp.com",
    // Temporary email services
    "mailinator.com",
    "10minutemail.com",
    "guerrillamail.com",
    "tempmail.org",
    "throwaway.email",
    "temp-mail.org",
    "yopmail.com",
    "maildrop.cc",
    "sharklasers.com",
    // Common typos that should be blocked
    "gmial.com",
    "yahooo.com",
    "gmai.com",
    "hotmial.com",
  ];

  const domain = email.split("@")[1]?.toLowerCase();

  if (fakeDomains.includes(domain)) {
    return false;
  }

  // Require legitimate domains in production
  const legitimateDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "zoho.com",
    "mail.com",
    // Educational domains
    "edu",
    ".edu",
    ".ac.",
    ".university",
    ".college",
  ];

  // Check if domain ends with any legitimate domain pattern
  return legitimateDomains.some(
    (legitDomain) => domain.endsWith(legitDomain) || domain.includes(".edu")
  );
};

// Complete email validation
const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return {
      valid: false,
      message: "Email is required",
    };
  }

  if (!validateEmailFormat(email)) {
    return {
      valid: false,
      message: "Invalid email format",
    };
  }

  if (!validateEmailDomain(email)) {
    return {
      valid: false,
      message: "Please use a valid email address from a legitimate domain",
    };
  }

  return {
    valid: true,
    message: "Email is valid",
  };
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate verification URL
const generateVerificationUrl = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/verify-email?token=${token}`;
};

module.exports = {
  validateEmail,
  validateEmailFormat,
  validateEmailDomain,
  generateVerificationToken,
  generateVerificationUrl,
};
