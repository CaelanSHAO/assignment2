"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambdas/updateStatus.ts
var updateStatus_exports = {};
__export(updateStatus_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(updateStatus_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var TABLE_NAME = process.env.TABLE_NAME;
var ddb = new import_client_dynamodb.DynamoDBClient({});
var handler = async (event, context) => {
  for (const record of event.Records) {
    const sns = record.Sns;
    let message;
    try {
      message = JSON.parse(sns.Message);
    } catch (err) {
      console.error("Invalid message body:", sns.Message);
      continue;
    }
    if (!message.id || !message.date || !message.update || !message.update.status || !message.update.reason) {
      console.error("Missing required fields:", message);
      continue;
    }
    if (message.update.status !== "Pass" && message.update.status !== "Reject") {
      console.error("Invalid status:", message.update.status);
      continue;
    }
    try {
      await ddb.send(new import_client_dynamodb.UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: message.id } },
        UpdateExpression: "SET #status = :status, #reason = :reason, #date = :date",
        ExpressionAttributeNames: {
          "#status": "status",
          "#reason": "reason",
          "#date": "date"
        },
        ExpressionAttributeValues: {
          ":status": { S: message.update.status },
          ":reason": { S: message.update.reason },
          ":date": { S: message.date }
        }
      }));
      console.log(`Updated status for image ${message.id}: ${message.update.status}`);
    } catch (err) {
      console.error("DynamoDB update error:", err);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
