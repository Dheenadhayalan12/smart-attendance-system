const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Configure S3 client - will use appropriate config based on environment
let s3Client;

if (process.env.NODE_ENV === "local" || process.env.IS_OFFLINE) {
  // LocalStack configuration
  s3Client = new S3Client({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    forcePathStyle: true,
  });
} else {
  // Production AWS configuration
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
  });
}

const S3_BUCKET = process.env.S3_BUCKET || "smart-attendance-faces";

// Upload file to S3
const uploadToS3 = async (key, buffer, contentType = "image/jpeg") => {
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  return await s3Client.send(putCommand);
};

module.exports = {
  s3Client,
  uploadToS3,
  S3_BUCKET,
};
