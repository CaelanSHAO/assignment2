import { SQSHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = new DynamoDBClient({});

function isValidImage(key: string) {
  return key.endsWith('.jpeg') || key.endsWith('.png');
}

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    // S3 event structure
    const snsMessage = body.Records ? body : JSON.parse(body.Message);
    for (const msg of snsMessage.Records) {
      const s3e = msg.s3;
      const key = decodeURIComponent(s3e.object.key.replace(/\+/g, ' '));
      if (!isValidImage(key)) {
        // 非法图片类型，抛异常让 SQS 进 DLQ
        throw new Error(`Invalid image type: ${key}`);
      }
      // 有效图片，写入 DynamoDB
      await ddb.send(new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          id: { S: key },
        },
      }));
      console.log(`Logged image: ${key}`);
    }
  }
}; 