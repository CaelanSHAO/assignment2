import { SNSEvent, Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = new DynamoDBClient({});
const ses = new SESClient({});
const SENDER_EMAIL = '20108796@mail.wit.ie';   // 发件人邮箱
const RECEIVER_EMAIL = '20108796@mail.wit.ie'; // 收件人邮箱
const snsClient = new SNSClient({});
const MAIL_TOPIC_ARN = process.env.MAIL_TOPIC_ARN!;

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
    if (!message.id || !message.date || !message.update || !message.update.status || !message.update.reason || !message.email) {
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

      const subject = `Your image "${message.id}" review result: ${message.update.status}`;
      const body = `Hello,\n\nYour image "${message.id}" has been reviewed.\nStatus: ${message.update.status}\nReason: ${message.update.reason || 'N/A'}\n\nThank you.`;
      await ses.send(new SendEmailCommand({
        Source: SENDER_EMAIL,
        Destination: { ToAddresses: [RECEIVER_EMAIL] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }));
      console.log(`Mail sent to ${RECEIVER_EMAIL} for image ${message.id}`);

      await snsClient.send(new PublishCommand({
        TopicArn: MAIL_TOPIC_ARN,
        Message: JSON.stringify({
          id: message.id,
          status: message.update.status,
          reason: message.update.reason,
        }),
      }));
    } catch (err) {
      console.error('DynamoDB update error:', err);
    }
  }
}; 