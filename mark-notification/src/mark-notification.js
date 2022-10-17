const { marshall } = require('@aws-sdk/util-dynamodb');

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDb = new DynamoDBClient({
  maxAttempts: 10,
  region: 'eu-west-2',
});

async function handler(event) {
  const postId = event.pathParameters['post-id'];
  const notificationId = event.pathParameters['notification-id'];

  const expressionAttributeValues = {
    ':read': true,
  };

  const expressionAttributeNames = {
    '#r': 'read',
  };
  const updateExpression = 'SET #r = :read';

  const params = {
    TableName: process.env.NOTIFICATIONS_TABLE,
    Key: marshall({ postId, notificationId }),
    ExpressionAttributeValues: marshall(expressionAttributeValues),
    ExpressionAttributeNames: expressionAttributeNames,
    UpdateExpression: updateExpression,
  };

  await dynamoDb.send(new UpdateItemCommand(params));
  return {
    statusCode: 202,
  };
}

exports.handler = handler;
