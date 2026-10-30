// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/pre_tool_call.schema.json.
// Self-contained so this file can move without changing imports.

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | JsonObject;

export type JsonObject = { [key: string]: JsonValue };

/**
 * Required properties only, recursively; optional schema members are omitted.
 * TypeScript does not enforce the scalar constraints documented below or JSON
 * serializability. Validate wire data before treating it as this contract.
 * Structural typing does not enforce exact object keys. The source schema
 * closes tool_call, but does not close the root, agent, session, or args.
 */
export interface PreToolCallContext {
  /** @pattern ^agent-hooks/\d+\.\d+$ */
  spec: string;
  interception_point: "pre_tool_call";
  /** @format date-time */
  timestamp: string;
  /**
   * Integer, not a fractional number.
   * @minimum 0
   */
  sequence: number;
  agent: {
    /** @minLength 1 */
    id: string;
    /** @pattern ^[a-z0-9_-]+$ */
    framework: string;
  };
  session: {
    /** @minLength 1 */
    id: string;
  };
  // The schema permits any JSON here; it does not prove equality with args.
  // The spec's target/args relationship requires a separate semantic check.
  target: JsonValue;
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
}
