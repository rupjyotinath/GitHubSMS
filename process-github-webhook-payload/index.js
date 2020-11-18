// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set region
AWS.config.update({region: 'us-east-2'});

exports.handler = async (event) => {
    console.log(event);
    console.log(event.Records[0].Sns);
    const message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);
    
    // Perform the primary Business Logic with the GitHub payload (message) & prepare the concised message/info
    
    // Parse the message (Convert to JSON)
    const parsedMessage=JSON.parse(message);
    console.log(parsedMessage);
    console.log(parsedMessage.body); // parsedMessage.body is a string
    
    const githubEvent=parsedMessage.headers["x-github-event"];
    console.log(githubEvent);
    
    // Get the actual GitHUb payload
    const payload=JSON.parse(parsedMessage.body);
    console.log(payload);
    
    let action; // The "action" is not available in every GitHub webhook payload based on event type
    if(payload.action){
        action=payload.action;
    }
    
    const repository=payload.repository.name;
    console.log(repository);
    
    const senderLogin=payload.sender.login;
    console.log(senderLogin);
    
    // Create the notification string
    let notification='';
    notification+=`New GitHub Event- ${githubEvent} `;
    if(action){
        notification+=`Action- ${action} `;
    }
    notification+=`Repository- ${repository} `;
    notification+=`Sender- ${senderLogin} `;
    
    
    // Send the concised information to another SNS Topic, which will then be finally sent via Twilio SMS
    
    // Create publish parameters
    const params = {
        Message: notification, /* required */
        TopicArn: process.env.TOPIC_ARN
    };

    // Create promise and SNS service object
    const publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    // Handle promise's fulfilled/rejected states
    try{
        const data=await publishTextPromise;
        console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
        console.log("MessageID is " + data.MessageId);
    }
    catch(err){
        console.error(err, err.stack);
        throw new Error("Unable to notify user, unable to publish to SNS");
    }
    
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Processed Successfully'),
    };
    return response;
};
