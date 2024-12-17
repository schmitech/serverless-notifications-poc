// lambda/create-notification.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDB = new DynamoDBClient({});

export const handler = async (event: any) => {
  try {
    const { userId, message } = JSON.parse(event.body);
    const timestamp = Date.now();
    const notificationId = `${userId}-${timestamp}`;

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        notificationId,
        userId,
        timestamp,
        message,
        status: 'unread'
      }
    };

    await dynamoDB.send(new PutCommand(params));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Notification created successfully',
        notificationId 
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to create notification' })
    };
  }
};