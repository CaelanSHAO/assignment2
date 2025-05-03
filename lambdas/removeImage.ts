import { SQSHandler } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    try {
      // Parse the SQS message body which contains the SNS message
      const snsMessage = JSON.parse(record.body);
      
      // Extract the S3 event from the SNS message
      const s3Event = JSON.parse(snsMessage.Message);
      
      // Process each S3 record
      for (const s3Record of s3Event.Records) {
        const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, ' '));
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          }));
          console.log(`Deleted invalid image: ${key}`);
        } catch (err) {
          console.error(`Failed to delete image: ${key}`, err);
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  }
}; 