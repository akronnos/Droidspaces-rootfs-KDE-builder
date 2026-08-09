#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const url = required("GITEE_UPLOAD_URL");
const token = required("GITEE_UPLOAD_TOKEN");
const assetPath = required("GITEE_UPLOAD_ASSET_PATH");
const responsePath = required("GITEE_UPLOAD_RESPONSE_PATH");
const timeoutMs = positiveInteger(process.env.GITEE_UPLOAD_TIMEOUT_MS || "600000", "GITEE_UPLOAD_TIMEOUT_MS");

try {
  const asset = await readFile(assetPath);
  const form = new FormData();
  form.set("file", new Blob([asset], { type: "application/octet-stream" }), basename(assetPath));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `token ${token}`,
    },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const responseBody = await response.text();
  await writeFile(responsePath, responseBody);
  console.error(
    `Gitee attachment upload: status=${response.status} asset_bytes=${asset.byteLength} response_bytes=${Buffer.byteLength(responseBody)}`,
  );
  process.stdout.write(`${response.status}\n`);
  process.exitCode = response.ok ? 0 : 1;
} catch (error) {
  await writeFile(responsePath, "").catch(() => {});
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message.replaceAll(token, "***") : String(error);
  console.error(`Gitee attachment upload transport error: ${name}: ${message}`);
  process.stdout.write("000\n");
  process.exitCode = 1;
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveInteger(value, name) {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive integer`);
  return Number(value);
}
