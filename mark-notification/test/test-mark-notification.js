const { describe } = require('mocha');
const { it, before, after } = require('mocha');
const chai = require('chai');
const dirtyChai = require('dirty-chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(dirtyChai);
const proxyquire = require('proxyquire').noCallThru();
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const mockResponse = {
    "type": "Comment",
    "read": false,
    "postTitle": "How to distinctively leverage existing wireless ROI",
    "comment": {
        "id": "e1788fb8b05d79c793c2002d57e80182",
        "commentText": " I really disagree with the content of this post. I belive the the client should really try to synthesize internal or 'organic' sources before not after leveraging!"
    },
    "user": {
        "id": "f1333326efc51be3d620d80f72c55944",
        "name": "Harold Lachlan"
    }
}

describe('mark notification as read', () => {
    let updateItemDynamoMock;
    let dynamoDbMock;
    let sut;
    before(() => {
        process.env.NOTIFICATIONS_TABLE = 'sometable'
    })
    beforeEach(() => {
        dynamoDbMock = sinon.stub().returns({
            send: sinon.stub().returns(Promise.resolve(mockResponse)),
        })
        updateItemDynamoMock = sinon.stub();
        sut = proxyquire('../src/mark-notification.js', {
            '@aws-sdk/util-dynamodb': {
                marshall: marshall,
            },
            '@aws-sdk/client-dynamodb': {
                DynamoDBClient: dynamoDbMock,
                UpdateItemCommand: updateItemDynamoMock
            }
        });
    });

    after(() => {
        delete process.env.NOTIFICATIONS_TABLE;
    })
    it('creates notification successfully', async () => {
        const response = await sut.handler({ pathParameters : { 'post-id':  '123', 'notification-id' : '789'}});
        sinon.assert.calledOnce(updateItemDynamoMock);
        const queryDyanmoArgs = updateItemDynamoMock.firstCall.lastArg;
        expect(queryDyanmoArgs.TableName).to.eq('sometable');
        expect(queryDyanmoArgs).to.have.property('Key');
        expect(queryDyanmoArgs).to.have.property('ExpressionAttributeValues');
        expect(queryDyanmoArgs).to.have.property('ExpressionAttributeNames');
        expect(queryDyanmoArgs).to.have.property('UpdateExpression');
        expect(unmarshall(queryDyanmoArgs.Key)).to.deep.eq({
            notificationId: "789",
            postId: "123"
        });
        expect(unmarshall(queryDyanmoArgs.ExpressionAttributeValues)).to.deep.eq({":read": true});
        expect(response.statusCode).to.eq(202)
    });

    it('throws error if dynamo calls fail', async () => {
        const errorObj = new Error('Call Failed');
        updateItemDynamoMock.throws(errorObj);
        await expect(sut.handler({ pathParameters : { 'post-id':  123, 'notification-id' : '789' }})).to.be.rejectedWith(errorObj)
    });
});
