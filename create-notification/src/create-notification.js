const { marshall } = require('@aws-sdk/util-dynamodb');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuid } = require('uuid');

const NOTIFICATION_TYPE = Object.freeze({
  COMMENT: 'COMMENT',
  LIKE: 'LIKE',
});

const dynamoDb = new DynamoDBClient({
  maxAttempts: 10,
  region: 'eu-west-2',
});

async function handler(event) {
  const postId = event.pathParameters['post-id'];
  const notification = JSON.parse(event.body);
  // Request body validation is performed by using open api validators
  // Api gateway integration in the open api spec
  // 'x-amazon-apigateway-request-validators' validates the request
  const username = notification.user.name;
  const userId = notification.user.id;
  const { type } = notification;
  const { postTitle } = notification;

  const notificationId = uuid();
  const item = {
    postId,
    notificationId,
    read: false,
    username,
    userId,
    postTitle,
    type,
  };

  if (type.toUpperCase() === NOTIFICATION_TYPE.COMMENT) {
    item.commentId = notification.comment.id;
    item.commentText = notification.comment.commentText;
  }

  const params = {
    TableName: process.env.NOTIFICATIONS_TABLE,
    Item: marshall(
      item,
    ),
  };

  await dynamoDb.send(new PutItemCommand(params));
  return {
    statusCode: 201,
  };
}

exports.handler = handler;
