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

// lambdas/addMetadata.ts
var addMetadata_exports = {};
__export(addMetadata_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(addMetadata_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var TABLE_NAME = process.env.TABLE_NAME;
var ddb = new import_client_dynamodb.DynamoDBClient({});
var ALLOWED_METADATA = ["Caption", "Date", "name"];
var handler = async (event, context) => {
  for (const record of event.Records) {
    const sns = record.Sns;
    const message = JSON.parse(sns.Message);
    const metadataType = sns.MessageAttributes?.metadata_type?.Value;
    if (!metadataType || !ALLOWED_METADATA.includes(metadataType)) {
      console.error("Invalid or missing metadata_type:", metadataType);
      continue;
    }
    if (!message.id || !message.value) {
      console.error("Invalid message body:", sns.Message);
      continue;
    }
    try {
      await ddb.send(new import_client_dynamodb.UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { id: { S: message.id } },
        UpdateExpression: `SET #attr = :val`,
        ExpressionAttributeNames: { "#attr": metadataType },
        ExpressionAttributeValues: { ":val": { S: message.value } }
      }));
      console.log(`Updated ${metadataType} for image ${message.id}`);
    } catch (err) {
      console.error("DynamoDB update error:", err);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
