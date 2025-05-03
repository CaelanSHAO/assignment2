declare const __dirname: string;

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-lambda-event-sources';

export class Assignment2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for image uploads
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // DynamoDB Table for image metadata and status
    const imageTable = new dynamodb.Table(this, 'ImageTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for event bus
    const topic = new sns.Topic(this, 'ImageTopic', {
      displayName: 'Image Event Topic',
    });

    // SQS Dead Letter Queue
    const dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(14),
    });

    // SQS Queue for image events
    const queue = new sqs.Queue(this, 'ImageQueue', {
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 1,
      },
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    // SNS -> SQS Subscription (filterPolicy 后续添加)
    topic.addSubscription(new subs.SqsSubscription(queue));

    // S3 -> SNS Notification
    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(topic)
    );

    // Log Image Lambda
    const logImageFn = new lambdaNode.NodejsFunction(this, 'LogImageFn', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/logImage.ts`,
      handler: 'handler',
      environment: {
        TABLE_NAME: imageTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        forceDockerBundling: false,
      },
    });

    // SQS -> Lambda 事件源
    logImageFn.addEventSource(new events.SqsEventSource(queue, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }));

    // 授权 Lambda 访问 DynamoDB
    imageTable.grantWriteData(logImageFn);

    // 输出资源名，便于后续 CLI 测试
    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'ImageTableName', {
      value: imageTable.tableName,
    });
    new cdk.CfnOutput(this, 'ImageTopicArn', {
      value: topic.topicArn,
    });
    new cdk.CfnOutput(this, 'ImageQueueUrl', {
      value: queue.queueUrl,
    });
    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
    });
  }
} 