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

// lambdas/removeImage.ts
var removeImage_exports = {};
__export(removeImage_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(removeImage_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var s3 = new import_client_s3.S3Client({});
var BUCKET_NAME = process.env.BUCKET_NAME;
var handler = async (event) => {
  for (const record of event.Records) {
    try {
      const snsMessage = JSON.parse(record.body);
      const s3Event = JSON.parse(snsMessage.Message);
      for (const s3Record of s3Event.Records) {
        const key = decodeURIComponent(s3Record.s3.object.key.replace(/\+/g, " "));
        try {
          await s3.send(new import_client_s3.DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
          }));
          console.log(`Deleted invalid image: ${key}`);
        } catch (err) {
          console.error(`Failed to delete image: ${key}`, err);
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
