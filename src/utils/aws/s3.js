const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./clients");

const S3_BUCKET = "smart-attendance-faces";

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

// Convert base64 image to buffer
const base64ToBuffer = (base64String) => {
  return Buffer.from(
    base64String.replace(/^data:image\/[a-z]+;base64,/, ""),
    "base64"
  );
};

// Generate unique filename for S3
const generateS3Key = (studentId, type = "face") => {
  const timestamp = Date.now();
  return `students/${studentId}/${type}_${timestamp}.jpg`;
};

module.exports = {
  s3Client,
  uploadToS3,
  base64ToBuffer,
  generateS3Key,
  S3_BUCKET,
};
