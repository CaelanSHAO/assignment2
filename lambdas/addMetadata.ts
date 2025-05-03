import { SNSEvent, Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = new DynamoDBClient({});

const ALLOWED_METADATA = ['Caption', 'Date', 'name'];

export const handler = async (event: SNSEvent, context: Context) => {
  for (const record of event.Records) {
    const sns = record.Sns;
    const message = JSON.parse(sns.Message);
    const metadataType = sns.MessageAttributes?.metadata_type?.Value;

    if (!metadataType || !ALLOWED_METADATA.includes(metadataType)) {
      console.error('Invalid or missing metadata_type:', metadataType);
      continue;
    }
    if (!message.id || !message.value) {
      console.error('Invalid message body:', sns.Message);
      continue;
    }
    try {
      await ddb.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: message.id } },
        UpdateExpression: `SET #attr = :val` ,
        ExpressionAttributeNames: { '#attr': metadataType },
        ExpressionAttributeValues: { ':val': { S: message.value } },
      }));
      console.log(`Updated ${metadataType} for image ${message.id}`);
    } catch (err) {
      console.error('DynamoDB update error:', err);
    }
  }
}; 