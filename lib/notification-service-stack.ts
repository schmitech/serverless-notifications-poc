// lib/notification-service-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class NotificationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for notifications
    const notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      partitionKey: { name: 'notificationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for PoC - don't use in production
    });

    // GSI for querying by userId
    notificationsTable.addGlobalSecondaryIndex({
      indexName: 'userId-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
    });

    // Lambda function to create notifications
    const createNotificationFn = new nodejs.NodejsFunction(this, 'CreateNotificationFunction', {
      entry: path.join(__dirname, '../lambda/create-notification.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: notificationsTable.tableName,
      },
    });

    // Lambda function to fetch notifications
    const fetchNotificationsFn = new nodejs.NodejsFunction(this, 'FetchNotificationsFunction', {
      entry: path.join(__dirname, '../lambda/fetch-notifications.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: notificationsTable.tableName,
      },
    });

    // Grant permissions to Lambda functions
    notificationsTable.grantWriteData(createNotificationFn);
    notificationsTable.grantReadData(fetchNotificationsFn);

    // Create function URLs for Lambda functions
    const createNotificationUrl = createNotificationFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Only for PoC - use proper auth in production
      cors: {
        allowedOrigins: ['*'], // Only for PoC - restrict in production
        allowedMethods: [lambda.HttpMethod.POST],
        allowedHeaders: ['*'],
      },
    });

    const fetchNotificationsUrl = fetchNotificationsFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Only for PoC - use proper auth in production
      cors: {
        allowedOrigins: ['*'], // Only for PoC - restrict in production
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ['*'],
      },
    });

    // Output the function URLs
    new cdk.CfnOutput(this, 'CreateNotificationUrl', {
      value: createNotificationUrl.url,
    });

    new cdk.CfnOutput(this, 'FetchNotificationsUrl', {
      value: fetchNotificationsUrl.url,
    });
  }
}