import { SNSEvent, Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = new DynamoDBClient({});

export const handler = async (event: SNSEvent, context: Context) => {
  for (const record of event.Records) {
    const sns = record.Sns;
    let message;
    try {
      message = JSON.parse(sns.Message);
    } catch (err) {
      console.error('Invalid message body:', sns.Message);
      continue;
    }
    if (!message.id || !message.date || !message.update || !message.update.status || !message.update.reason) {
      console.error('Missing required fields:', message);
      continue;
    }
    if (message.update.status !== 'Pass' && message.update.status !== 'Reject') {
      console.error('Invalid status:', message.update.status);
      continue;
    }
    try {
      await ddb.send(new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: message.id } },
        UpdateExpression: 'SET #status = :status, #reason = :reason, #date = :date',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#reason': 'reason',
          '#date': 'date',
        },
        ExpressionAttributeValues: {
          ':status': { S: message.update.status },
          ':reason': { S: message.update.reason },
          ':date': { S: message.date },
        },
      }));
      console.log(`Updated status for image ${message.id}: ${message.update.status}`);
    } catch (err) {
      console.error('DynamoDB update error:', err);
    }
  }
}; 