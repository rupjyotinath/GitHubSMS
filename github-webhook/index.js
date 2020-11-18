const crypto=require('crypto');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set region
AWS.config.update({region: 'us-east-2'});

exports.handler = async (event) => {
    const hmac=crypto.createHmac('sha256',process.env.SECRET);
    console.log(event);
    const gitHubSignature=event.headers["x-hub-signature-256"];
    console.log(gitHubSignature);
    const gitHubEvent=event.headers["x-github-event"];
    console.log(event.body);
    const payload=event.body;
    const parsedBody=JSON.parse(event.body);
    console.log(parsedBody)
    let message="Request accepted, will be processed";
    
    const response = {
        statusCode: 200,
        body: JSON.stringify(message),
    };
    
    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'), 'utf8');
    console.log(digest);
    const checksum = Buffer.from(gitHubSignature, 'utf8');
    console.log(checksum);
    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
        console.log("Signature Mis Match");
        // Since signature does not match, will not process the payload
        // Return response here itself
        message="Signature Mismatch. Check the SECRET";
        response.statusCode=401;
        response.body=JSON.stringify(message);
        
        return response;
    }
    
    // Create publish parameters
    const params = {
        Message: JSON.stringify(event), /* required */
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
    }
    
    
    console.log("Sending Response");
    return response;
};
