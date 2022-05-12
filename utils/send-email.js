const fs = require("fs");
const path = require("path");

require("dotenv").config();
const Handlebars = require("handlebars");

// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Set the region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

let templateHtml;
let subject;

function sendEmail(destinationEmailAddess, templateName, templateData) {
  switch (templateName) {
    case "ApiKeyTemplate":
      templateHtml = fs.readFileSync(
        path.resolve(__dirname, "./email-templates/api-key-template.hbs"),
        "utf8"
      );
      subject = "Your Shyft API Key";
      break;
    /**
     * More templates can be added here
     */
  }

  const compiledTemplate = Handlebars.compile(templateHtml);
  const rawHtml = compiledTemplate(templateData);

  // Create sendEmail params
  const params = {
    Destination: {
      /* required */
      // CcAddresses: [
      //   'EMAIL_ADDRESS',
      // ],
      ToAddresses: [destinationEmailAddess],
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: "UTF-8",
          Data: rawHtml,
        },
        // Text: {
        //  Charset: "UTF-8",
        //  Data: "TEXT_FORMAT_BODY"
        // }
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: process.env.SES_EMAIL_ID /* required */,
    // ReplyToAddresses: [
    //   "Email Address",
    // ],
  };

  // Create the promise and SES service object
  const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
    .sendEmail(params)
    .promise();
  return sendPromise;
}

module.exports = sendEmail;
