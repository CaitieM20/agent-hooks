// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Sources: spec/schema/generated/strict-contexts/*.schema.json.
// Required-only API views: no optional members, interception_point, or target.
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
 * Required metadata only; optional schema members are omitted recursively.
 * TypeScript does not enforce the scalar constraints below, exact object keys,
 * or JSON serializability. Validate data at the wire boundary.
 * Hook interfaces are erased at runtime: hook-bound dispatch retains identity.
 * A wire adapter flattens context and supplies interception_point and target.
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

// agent_startup: a wire adapter derives target from agent_init.
export interface AgentStartupContext {
  context: AgentContext;
  agent_init: {
    tools_registered: string[];
  };
}

// input: a wire adapter derives target from input, not content alone.
export interface InputContext {
  context: AgentContext;
  input: {
    content: JsonValue;
    role: "user" | "system" | "external";
  };
}

// pre_model_call: a wire adapter derives target from messages, not model.
export interface PreModelCallContext {
  context: AgentContext;
  model: {
    id: string;
  };
  messages: {
    role: string;
    content: JsonValue;
  }[];
}

// post_model_call: a wire adapter derives target from the entire response.
export interface PostModelCallContext {
  context: AgentContext;
  model: {
    id: string;
  };
  response: {
    content: JsonValue;
    // Required even when empty; the schema's optional tool-call id is omitted.
    tool_calls: {
      name: string;
      args: JsonObject;
    }[];
    finish_reason: string;
  };
}

// pre_tool_call: a wire adapter derives target from tool_call.args.
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

// post_tool_call: a wire adapter derives target from tool_result.value.
export interface PostToolCallContext {
  context: AgentContext;
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
  tool_result: {
    value: JsonValue;
    is_error: boolean;
  };
}

// output: a wire adapter derives target from output, not content alone.
export interface OutputContext {
  context: AgentContext;
  output: {
    content: JsonValue;
  };
}

// agent_shutdown: a wire adapter derives target from summary.
export interface AgentShutdownContext {
  context: AgentContext;
  summary: {
    reason: "completed" | "error" | "cancelled";
  };
}
