// config/s3.js
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");

// 1. Create S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 2. Multer with memoryStorage (uploads file to RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// 3. Function to manually upload to S3
const uploadFileToS3 = async (
  fileBuffer,
  fileName,
  mimeType,
  folder = "products"
) => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3.send(command);
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { url: fileUrl, key };
};

// 4. Function to delete multiple files from S3
const deleteFilesFromS3 = async (keys = []) => {
  if (keys.length === 0) return;

  const command = new DeleteObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  });

  await s3.send(command);
};

module.exports = {
  upload, // multer middleware
  uploadFileToS3,
  deleteFilesFromS3,
};
