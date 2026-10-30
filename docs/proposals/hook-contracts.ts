// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Sources: spec/schema/generated/strict-contexts/*.schema.json.
// Required-only hook payloads: no optional payload members, interception_point,
// or target. Verdict metadata preserves the existing optional response fields.
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
 * A wire adapter flattens agentContext and hook payloads, then supplies
 * interception_point and target.
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
 * Generic extension-friendly request envelope. Hook-specific request
 * interfaces add their required payload properties at the top level.
 */
export interface HooksRequest {
  agentContext: AgentContext;
  [extension: string]: unknown;
}

export interface VerdictFields {
  reason?: string | null;
  message?: string | null;
  warnings?: {
    reason?: string | null;
    message?: string | null;
  }[] | null;
  evidence?: {
    artefact?: string | null;
    verification_pointers?: Record<string, string>;
  };
  result_labels?: string[] | null;
}

export interface Transform {
  path: string;
  value?: JsonValue;
}

/**
 * The decision set is centralized; hooks may specialize only the transform
 * payload, not add or remove decisions.
 */
export type Verdict<TTransform = Transform> = VerdictFields &
  (
    | { decision: "allow" }
    | { decision: "deny"; approval?: JsonObject }
    | { decision: "transform"; transform: TTransform }
  );

/** Generic response envelope; specialized responses narrow `verdict`. */
export interface HooksResponse<TTransform = Transform> {
  verdict: Verdict<TTransform>;
}

export type HooksHandler<
  TRequest extends HooksRequest = HooksRequest,
  TTransform = Transform,
> = (
  request: TRequest,
) => HooksResponse<TTransform> | Promise<HooksResponse<TTransform>>;

/**
 * Placeholder only: hook-specific transform payloads still need design.
 * This does not imply transforms are permitted for every hook; the current
 * spec forbids them for agent_startup and agent_shutdown.
 */
export type UnresolvedHookTransform = unknown;

// ---------------------------------------------------------------------------
// Hook: agent_startup
// ---------------------------------------------------------------------------
export interface AgentStartupHookRequest extends HooksRequest {
  agent_init: {
    tools_registered: string[];
  };
}

export interface AgentStartupHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type AgentStartupHookHandler = HooksHandler<
  AgentStartupHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: input
// ---------------------------------------------------------------------------
export interface InputHookRequest extends HooksRequest {
  input: {
    content: JsonValue;
    role: "user" | "system" | "external";
  };
}

export interface InputHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type InputHookHandler = HooksHandler<
  InputHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: pre_model_call
// ---------------------------------------------------------------------------
export interface PreModelHookRequest extends HooksRequest {
  model: {
    id: string;
  };
  messages: {
    role: string;
    content: JsonValue;
  }[];
}

export interface PreModelHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type PreModelHookHandler = HooksHandler<
  PreModelHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: post_model_call
// ---------------------------------------------------------------------------
export interface PostModelHookRequest extends HooksRequest {
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

export interface PostModelHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type PostModelHookHandler = HooksHandler<
  PostModelHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: pre_tool_call
// ---------------------------------------------------------------------------
export interface PreToolHookRequest extends HooksRequest {
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
}

/** Transform replaces the complete tool args for the pre-tool hook. */
export interface PreToolHookTransform {
  args: JsonObject;
}

export interface PreToolHookResponse
  extends HooksResponse<PreToolHookTransform> {}

export type PreToolHookHandler = HooksHandler<
  PreToolHookRequest,
  PreToolHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: post_tool_call
// ---------------------------------------------------------------------------
export interface PostToolHookRequest extends HooksRequest {
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

export interface PostToolHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type PostToolHookHandler = HooksHandler<
  PostToolHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: output
// ---------------------------------------------------------------------------
export interface OutputHookRequest extends HooksRequest {
  output: {
    content: JsonValue;
  };
}

export interface OutputHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type OutputHookHandler = HooksHandler<
  OutputHookRequest,
  UnresolvedHookTransform
>;

// ---------------------------------------------------------------------------
// Hook: agent_shutdown
// ---------------------------------------------------------------------------
export interface AgentShutdownHookRequest extends HooksRequest {
  summary: {
    reason: "completed" | "error" | "cancelled";
  };
}

export interface AgentShutdownHookResponse
  extends HooksResponse<UnresolvedHookTransform> {}

export type AgentShutdownHookHandler = HooksHandler<
  AgentShutdownHookRequest,
  UnresolvedHookTransform
>;
