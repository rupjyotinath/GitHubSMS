# GitHubSMS

Get instant updates about GitHub activities via SMS.

*Basically, configuring the GitHub webhook to send SMS.*

## Architecture


Refer below the architecture diagram of the project.

![Architecture Diagram](/GitHubSMS_Architecture_Rupjyoti.png)

### Explanation

* GitHub webhook is configured to send data to AWS API Gateway endpoint. A secret is also provided, so the authenticity can be verified.

* The API Gateway triggers the AWS Lamda Function 1 (named as "github-webhook").

* This Lambda function (github-webhook) verifies the GitHub signature provided via header **X-Hub-Signature-256**. After that it publishes the entire event to an Amazon SNS topic ("Topic 1" in diagram, actually named as "github-webhook-payload"). It then sends response to GitHub via the API Gateway.

* The SNS topic (github-webhook-payload) triggers another Lambda function (Lambda 2 in diagram, actually named as "process-github-webhook-payload").

* This Lambda function has the actual business logic of the appication. For simplicity, I have created a simple notification string regarding the activity. It publishes this notification message to another SNS topic ("Topic 2" in diagram, actually named "notify-user").

* The SNS triggers third Lambda function (actually named "twilio-sms").

* The Lambda function 3 (twilio-sms) is configured with Twilio API . It finally sends the SMS with the message body obtained from the SNS.

## Getting Started


There are few basic prerequisites.
### Prerequisites
* AWS account (AWS gives 12 months free tier)
* Basic familiarity with the AWS console.
* Creating a Lambda function from the console, creating an SNS topic, adding a Lambda trigger. (*Its absolutely fine without having done these before, its easy from console*)
* Sending an SMS using Twilio . Will need the Account_sid, auth_token, the "from" number and "to" number
* Node.js and npm installed
* Last & obvious :) GitHub account for configuring webhook

### Actual Steps
1. Fork or clone the repository.

1. Create the first Lambda function named as "**github-webhook**". Copy the code of github-webhook/index.js file from the repository & paste it in the index.js file of the created function (replace the existing code).

1. Now, we need to add **two Environment Variables** to this function. Before that, create an **SNS topic** (Standard, not FIFO) from the SNS console. Name it "**github-webhook-payload**". Copy its ARN . Now, in the Lambda function , add environment variable **TOPIC_ARN** with value of the ARN of the SNS topic.
The second environment variable is the secret key that needs to be provided to GitHub to verify the requests. Create any random secret. Add environment variable **SECRET** with the value of the secret key.
Click "Deploy" to deploy the function.

1. Finally for this Lambda function, we need to add a trigger which will invoke the function. Click on Add Trigger and add an API Gateway trigger. The endpoint url needs to be provided to GitHub later.

1. Configure the API Gateway to only accept POST requests because GitHub will only send POST requests.

1. Create the second Lambda function. Name it "**process-github-webhook-payload**" . Copy the code from process-github-webhook-payload/index.js and paste it in the editor (index.js). We need the topic ARN of the SNS topic, this Lambda function will publish to. So, create another **SNS topic**, name it "**notify-user**". Now add the ARN of this SNS topic in the **Environment variable** as **TOPIC_ARN**. Deploy the function.

1. We now need to create a trigger for this second lambda function. We need to specify the SNS topic "github-webhook-payload" as the trigger. In other words, the Lambda function will work as a subscriber to the topic in which the first lambda function publishes the data. Create the trigger from Lambda or create a subscribtion on SNS topic "github-webhook-payload" . Whenever new message comes in the SNS, it will trigger this function.

1. The final Lamda function is left. This will actually send the SMS using Twilio. It will be triggered by the **SNS topic "notify-user"**. Twilio is not included by AWS , so we need to provide the dependencies. The code cannot be written online in the console.
    * Navigate inside twilio-sms directory , open cmd/ terminal
    * run ```
    npm install ``` This will install the twilio npm module.
    * **Now zip the entire contents of the twilio-sms folder (including the node_modules)**. Create a Lambda function named as "twilio-sms" and upload the zip. Deploy the function.
    * Here, we need to define Twilio credentials as **Environment variables**. Add Environment variables **ACCOUNT_SID, AUTH_TOKEN, SEND_FROM & SEND_TO** . *Make sure to add country code in the phone/mobile numbers for Twilio API to work*.

1. The final Lambda function is ready, add the trigger as SNS subscription (topic "notify-user").

1. Configure the GitHub webhook in settings of a repository or directly on account and provide the URL obtained from the API Gateway earlier, as obtained in step 4. Select request type as **JSON** . There are **various events supported by GitHub. Its upto the user to choose & accordingly modify the code of the second lambda function to send desired SMS.**

Any new activities now should trigger the webhook and hence you will receive the notification via SMS.

**All logs will appear in Cloudwatch.**

## Improvements/ Production Considerations

1. Specific AWS accounts and IAM permission.
1. I have used more console.log, maybe use less.
1. Versioning and staging of API and Lambda function
1. More custom error handling.
1. Avoid writing code in online editor directly. Need to have automatic deployment. Maybe use AWS SAM (Serverless Appllication Model).

As a personal project & use case, without these consideration should be fine.

## LICENSE

MIT

Check the LICENSE file included in the repository.