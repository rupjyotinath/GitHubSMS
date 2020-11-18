const accountSid=process.env.ACCOUNT_SID;
const authToken=process.env.AUTH_TOKEN;

const client = require('twilio')(accountSid,authToken);

exports.handler = async (event) => {
    console.log(event);
    console.log(event.Records[0].Sns);
    const message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);

    // Send SMS 
    try{
        const sentMessage= await client.messages.create({
            body:message,
            from: process.env.SEND_FROM,
            to:process.env.SEND_TO
        });
        console.log(sentMessage);
        console.log("Message SID "+sentMessage.sid);
    }
    catch(error){
        console.log(error)
        throw new Error("Unable to send SMS");
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify('SMS Sent'),
    };
    return response;
};