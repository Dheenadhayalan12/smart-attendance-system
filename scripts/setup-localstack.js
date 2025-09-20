const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  S3Client,
  CreateBucketCommand,
  ListBucketsCommand,
} = require("@aws-sdk/client-s3");

// Configure clients for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const s3Client = new S3Client({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true,
});

const tables = [
  {
    TableName: "Teachers",
    KeySchema: [{ AttributeName: "teacherId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "teacherId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Classes",
    KeySchema: [{ AttributeName: "classId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "classId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Sessions",
    KeySchema: [{ AttributeName: "sessionId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "sessionId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Students",
    KeySchema: [{ AttributeName: "studentId", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "studentId", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
  {
    TableName: "Attendance",
    KeySchema: [{ AttributeName: "attendanceId", KeyType: "HASH" }],
    AttributeDefinitions: [
      { AttributeName: "attendanceId", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
];

async function setupTables() {
  console.log("Setting up DynamoDB tables in LocalStack...");

  try {
    // Check existing tables
    const existingTables = await dynamoClient.send(new ListTablesCommand({}));
    console.log("Existing tables:", existingTables.TableNames);

    for (const table of tables) {
      if (existingTables.TableNames.includes(table.TableName)) {
        console.log(`Table ${table.TableName} already exists, skipping...`);
        continue;
      }

      console.log(`Creating table: ${table.TableName}`);
      await dynamoClient.send(new CreateTableCommand(table));
      console.log(`✓ Created table: ${table.TableName}`);
    }

    console.log("All tables setup complete!");
  } catch (error) {
    console.error("Error setting up tables:", error);
  }
}

async function setupS3Buckets() {
  console.log("Setting up S3 buckets in LocalStack...");

  try {
    // Check existing buckets
    const existingBuckets = await s3Client.send(new ListBucketsCommand({}));
    const bucketNames = existingBuckets.Buckets?.map((b) => b.Name) || [];

    const requiredBuckets = ["smart-attendance-faces"];

    for (const bucketName of requiredBuckets) {
      if (bucketNames.includes(bucketName)) {
        console.log(`Bucket ${bucketName} already exists, skipping...`);
        continue;
      }

      console.log(`Creating bucket: ${bucketName}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`✓ Created bucket: ${bucketName}`);
    }

    console.log("All buckets setup complete!");
  } catch (error) {
    console.error("Error setting up buckets:", error);
  }
}

async function setupLocalStack() {
  console.log("🔧 Setting up LocalStack environment...\n");

  await setupTables();
  console.log("");
  await setupS3Buckets();

  console.log("\n✅ LocalStack setup complete!");
  console.log("🚀 Ready for development and testing.");
}

setupLocalStack();
