const {
  DynamoDBClient,
  CreateTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");

// Configure DynamoDB client for LocalStack
const dynamoClient = new DynamoDBClient({
  endpoint: "http://localhost:4566",
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
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

setupTables();
