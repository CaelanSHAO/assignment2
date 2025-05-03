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

// lambdas/logImage.ts
var logImage_exports = {};
__export(logImage_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(logImage_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var TABLE_NAME = process.env.TABLE_NAME;
var ddb = new import_client_dynamodb.DynamoDBClient({});
function isValidImage(key) {
  return key.endsWith(".jpeg") || key.endsWith(".png");
}
var handler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const snsMessage = body.Records ? body : JSON.parse(body.Message);
    for (const msg of snsMessage.Records) {
      const s3e = msg.s3;
      const key = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));
      if (!isValidImage(key)) {
        throw new Error(`Invalid image type: ${key}`);
      }
      await ddb.send(new import_client_dynamodb.PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          id: { S: key }
        }
      }));
      console.log(`Logged image: ${key}`);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
