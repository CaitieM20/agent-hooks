// Copyright (c) Microsoft. All rights reserved.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const sdk = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = resolve(sdk, "..", "..");
const schema = join(root, "spec", "schema");
const generated = join(schema, "generated");
const mirror = join(root, "sdk", "python", "python", "agent_hooks", "schema");
const idBase = "https://responsibleai.github.io/agent-hooks/schema/v0.1/";
const roots = [
  "agent-context", "approval", "host-declaration-1.0", "host-declaration-1.1",
  "interception-point", "interception-record", "interceptor-response", "verdict",
].map((name) => `${name}.schema.json`);
const points = [
  "agent_startup", "agent_shutdown", "input", "output", "pre_model_call",
  "post_model_call", "pre_tool_call", "post_tool_call",
].map((name) => `${name}.schema.json`);
const files = [
  ...roots.map((file) => [file, file]),
  ...points.map((file) => [join("strict-contexts", file), join("agent-context", file)]),
];

test("generated layout preserves schema identities and Python resources", () => {
  assert.deepEqual(readdirSync(generated).sort(), [...roots, "strict-contexts"].sort());
  assert.deepEqual(readdirSync(join(generated, "strict-contexts")).sort(), points.sort());
  assert.equal(readdirSync(schema).some((file) => file.endsWith(".schema.json")), false);
  for (const [file, published] of files) {
    const text = readFileSync(join(generated, file), "utf8").replaceAll("\r\n", "\n");
    assert.equal(text, readFileSync(join(mirror, published), "utf8").replaceAll("\r\n", "\n"), file);
    assert.equal(JSON.parse(text).$id, idBase + published.replaceAll("\\", "/"));
  }
});

test("generated schemas compile and resolve conformance vector references", () => {
  const ajv = new Ajv2020({ strict: false });
  addFormats(ajv);
  const documents = files.map(([file]) => JSON.parse(readFileSync(join(generated, file), "utf8")));
  const vectors = join(root, "conformance");
  documents.push(JSON.parse(readFileSync(join(vectors, "vectors.schema.json"), "utf8")));
  for (const doc of documents) ajv.addSchema(doc);
  for (const doc of documents) assert.ok(ajv.getSchema(doc.$id), doc.$id);
  const validate = ajv.getSchema(documents.at(-1).$id);
  for (const file of readdirSync(join(vectors, "vectors")).filter((file) => file.endsWith(".json"))) {
    const vector = JSON.parse(readFileSync(join(vectors, "vectors", file), "utf8"));
    assert.ok(validate(vector), `${file}: ${ajv.errorsText(validate.errors)}`);
  }
});

for (const [name, old, current] of [
  ["legacy directory and schema root", mirror, schema],
  ["generated directory and schema root", generated, schema],
]) {
  test(`equivalence loads ${name} without changing canonical keys`, () => {
    const output = execFileSync(process.execPath, [
      "--import", "tsx", "scripts/schema-equivalence.mts",
      "--old", old, "--new", current, "--structural-diff",
    ], { cwd: sdk, encoding: "utf8" });
    assert.match(output, /structural diff: 0 differing path\(s\) after normalization/);
  });
}
