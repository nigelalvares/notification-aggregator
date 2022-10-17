# Notification Aggregator
A serverless microservices application that aggregates notifications and is deployed to AWS using Lambdas and is accessible via an API Gateway.

# Things to note:
- Endpoints are defined in the open api spec file -> api-definition.yaml
- Url for accessing the application will be sent via email.
- A few notifications have been preloaded and can be accessed using the GET endpoint. Additional notifications can be added by referring to the openapi spec
```shell
GET notifications/{post-id}

Preloaded post-id are as below
7d78ff348647b782cb3027d836d23e09
b1638f970c3ddd528671df76c4dcf13e
c4cfbe322bb834ada81719036f9b287b
```
- Notifications can be created by calling the POST endpoint
```
POST notifications/{post-id}
```
- Notification can be marked as read by calling the PUT endpoint. Notification id can be retrieved from the GET endpoint
```shell
PUT notifications/{post-id}/{notification-id}/read
```

## Further steps if there was more time
- Implement authentication via lambda authorizer using bearer tokens
- Improve logging and error handling
- Write integration/system tests
