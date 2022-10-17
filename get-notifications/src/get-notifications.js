const {
  marshall, unmarshall,
} = require('@aws-sdk/util-dynamodb');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDb = new DynamoDBClient({
  maxAttempts: 10,
  region: 'eu-west-2',
});

function formatResponse(response) {
  const formattedResponse = {
    id: response.notificationId,
    type: response.type,
    read: response.read,
    post: {
      id: response.postId,
      title: response.postTitle,
    },
    user: {
      id: response.userId,
      name: response.username,
    },
  };

  if (response.commentId) {
    formattedResponse.comment = {
      id: response.commentId,
      commentText: response.commentText,
    };
  }
  return formattedResponse;
}

async function handler(event) {
  const postId = event.pathParameters['post-id'];
  const params = {
    TableName: process.env.NOTIFICATIONS_TABLE,
    KeyConditionExpression: 'postId = :p',
    ExpressionAttributeValues: marshall({
      ':p': postId,
    }),
  };
  const data = await dynamoDb.send(new QueryCommand(params));

  let response;
  if (data && data.Items) {
    response = data.Items.map((items) => formatResponse(unmarshall(items)));
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
}

exports.handler = handler;
