// Shared AWS clients configuration for LocalStack
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");
const { RekognitionClient } = require("@aws-sdk/client-rekognition");

// LocalStack endpoint configuration
const localStackConfig = {
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
};

// Initialize AWS clients
const dynamoClient = new DynamoDBClient(localStackConfig);
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({
  ...localStackConfig,
  forcePathStyle: true, // Required for LocalStack
});

const rekognitionClient = new RekognitionClient(localStackConfig);

// Constants
const FACE_COLLECTION_ID = "smart-attendance-faces";
const S3_BUCKET = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80;

module.exports = {
  dynamodb,
  s3Client,
  rekognitionClient,
  FACE_COLLECTION_ID,
  S3_BUCKET,
  FACE_MATCH_THRESHOLD,
};
