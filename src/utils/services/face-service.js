const {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
} = require("@aws-sdk/client-rekognition");

// Configure Rekognition client for production
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Constants
const FACE_COLLECTION_ID = "smart-attendance-faces";
const FACE_MATCH_THRESHOLD = 80;

// Initialize face collection
const initializeFaceCollection = async () => {
  try {
    const collections = await rekognitionClient.send(
      new ListCollectionsCommand({})
    );
    if (!collections.CollectionIds.includes(FACE_COLLECTION_ID)) {
      await rekognitionClient.send(
        new CreateCollectionCommand({
          CollectionId: FACE_COLLECTION_ID,
        })
      );
      console.log("Face collection created");
    }
  } catch (error) {
    console.log("Face collection initialization:", error.message);
  }
};

// Index a face for a student
const indexFace = async (imageBuffer, externalImageId) => {
  await initializeFaceCollection();

  const indexFacesCommand = new IndexFacesCommand({
    CollectionId: FACE_COLLECTION_ID,
    Image: { Bytes: imageBuffer },
    ExternalImageId: externalImageId,
    DetectionAttributes: ["ALL"],
  });

  return await rekognitionClient.send(indexFacesCommand);
};

// Search for a face in the collection
const searchFace = async (imageBuffer) => {
  const searchCommand = new SearchFacesByImageCommand({
    CollectionId: FACE_COLLECTION_ID,
    Image: { Bytes: imageBuffer },
    FaceMatchThreshold: FACE_MATCH_THRESHOLD,
    MaxFaces: 1,
  });

  return await rekognitionClient.send(searchCommand);
};

module.exports = {
  initializeFaceCollection,
  indexFace,
  searchFace,
  FACE_COLLECTION_ID,
  FACE_MATCH_THRESHOLD,
};
