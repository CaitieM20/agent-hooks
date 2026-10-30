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
 * serializability. This reusable metadata type excludes hook-specific fields.
 */
export interface AgentContext {
  /** @pattern ^agent-hooks/\d+\.\d+$ */
  spec: string;
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
}

/**
 * Exploratory composed API shape, not the current flat wire representation.
 * The hook-specific interface replaces an explicit interception_point field;
 * tool_call.args is the input, without a duplicate target field. Interfaces
 * are erased at runtime, so the entry point/adapter must retain hook identity.
 * A wire adapter would flatten context, set interception_point to
 * "pre_tool_call", and derive target from tool_call.args.
 * Structural typing does not enforce exact object keys. The source schema
 * closes tool_call, but does not close the root, agent, session, or args.
 */
export interface PreToolCallContext {
  context: AgentContext;
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
}
