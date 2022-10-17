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

const mockRequest = {
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
const testUuid = '123456';
describe('create notification', () => {
    let putDynamoMock;
    let dynamoDbMock;
    let uuidStub;
    let sut;
    before(() => {
        process.env.NOTIFICATIONS_TABLE = 'sometable'
    })
    beforeEach(() => {
        uuidStub = sinon.stub().returns(testUuid);
        dynamoDbMock = sinon.stub().returns({
            send: sinon.stub(),
        })
        putDynamoMock = sinon.stub();
        sut = proxyquire('../src/create-notification.js', {
            '@aws-sdk/util-dynamodb': {
                marshall: marshall,
            },
            '@aws-sdk/client-dynamodb': {
                DynamoDBClient: dynamoDbMock,
                PutItemCommand: putDynamoMock
            },
            'uuid': {
                v4: uuidStub,
            },
        });
    });

    after(() => {
        delete process.env.NOTIFICATIONS_TABLE;
    })
    it('creates notification successfully', async () => {
        const response = await sut.handler({ pathParameters : { 'post-id':  123 }, body: JSON.stringify(mockRequest)});
        sinon.assert.calledOnce(putDynamoMock);
        const putDyanmoArgs = putDynamoMock.firstCall.lastArg;
        expect(putDyanmoArgs.TableName).to.eq('sometable');
        expect(putDyanmoArgs).to.have.property('Item');

        const expectedResponse = {
            "commentId": "e1788fb8b05d79c793c2002d57e80182",
            "commentText": " I really disagree with the content of this post. I belive the the client should really try to synthesize internal or 'organic' sources before not after leveraging!",
            "notificationId": "123456",
            "postId": 123,
            "postTitle": "How to distinctively leverage existing wireless ROI",
            "read": false,
            "type": "Comment",
            "userId": "f1333326efc51be3d620d80f72c55944",
            "username": "Harold Lachlan"
        }
        expect(unmarshall(putDyanmoArgs.Item)).to.deep.eq(expectedResponse);
        expect(response.statusCode).to.eq(201)
    });

    it('throws error if dynamo calls fail', async () => {
        const errorObj = new Error('Call Failed');
        putDynamoMock.throws(errorObj);
        await expect(sut.handler({ pathParameters : { 'post-id':  123 }, body: JSON.stringify(mockRequest)})).to.be.rejectedWith(errorObj)
    });
});
