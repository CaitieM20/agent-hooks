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

/**
 * A path/value replacement within a hook's semantic `$target`; it is not a
 * path into the request envelope. `$target` (and the deprecated
 * `$policy_target` alias) maps as follows:
 *
 * | Hook | `$target` maps to |
 * | --- | --- |
 * | `input` | `request.input` |
 * | `pre_model_call` | `request.messages` |
 * | `post_model_call` | `request.response` |
 * | `pre_tool_call` | `request.tool_call.args` |
 * | `post_tool_call` | `request.tool_result.value` |
 * | `output` | `request.output` |
 *
 * The bare root replaces the mapped value; descendants use the existing
 * dot-member, bracket-index, or bracket-member path grammar. The host writes
 * the replacement back to that mapped payload only. An omitted `value` means
 * `null`. Startup and shutdown have no mutable target and forbid transforms.
 * TODO: Define a distinct Transform type for each transformable hook.
 */
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

/** Generic data response envelope; specialized responses narrow `verdict`. */
export interface HooksResponse<TTransform = Transform> {
  verdict: Verdict<TTransform>;
}

// ---------------------------------------------------------------------------
// Hook: agent_startup
// ---------------------------------------------------------------------------
export interface AgentStartupHookRequest extends HooksRequest {
  agent_init: {
    tools_registered: string[];
  };
}

export interface AgentStartupHookResponse
  extends HooksResponse<never> {}

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
  extends HooksResponse<Transform> {}

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
  extends HooksResponse<Transform> {}

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
  extends HooksResponse<Transform> {}

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
  extends HooksResponse<Transform> {}

// ---------------------------------------------------------------------------
// Hook: output
// ---------------------------------------------------------------------------
export interface OutputHookRequest extends HooksRequest {
  output: {
    content: JsonValue;
  };
}

export interface OutputHookResponse
  extends HooksResponse<Transform> {}

// ---------------------------------------------------------------------------
// Hook: agent_shutdown
// ---------------------------------------------------------------------------
export interface AgentShutdownHookRequest extends HooksRequest {
  summary: {
    reason: "completed" | "error" | "cancelled";
  };
}

export interface AgentShutdownHookResponse
  extends HooksResponse<never> {}

// ===========================================================================
// SDK-facing handler pairing (separate from serialized data contracts)
// ===========================================================================

/**
 * Synchronous illustrative pairing between a hook request and its response.
 * Execution and asynchronous scheduling are SDK decisions outside this
 * data-contract sketch.
 */
export type HookHandler<TRequest, TResponse> = (
  request: TRequest,
) => TResponse;

export type AgentStartupHookHandler = HookHandler<
  AgentStartupHookRequest,
  AgentStartupHookResponse
>;

export type InputHookHandler = HookHandler<
  InputHookRequest,
  InputHookResponse
>;

export type PreModelHookHandler = HookHandler<
  PreModelHookRequest,
  PreModelHookResponse
>;

export type PostModelHookHandler = HookHandler<
  PostModelHookRequest,
  PostModelHookResponse
>;

export type PreToolHookHandler = HookHandler<
  PreToolHookRequest,
  PreToolHookResponse
>;

export type PostToolHookHandler = HookHandler<
  PostToolHookRequest,
  PostToolHookResponse
>;

export type OutputHookHandler = HookHandler<
  OutputHookRequest,
  OutputHookResponse
>;

export type AgentShutdownHookHandler = HookHandler<
  AgentShutdownHookRequest,
  AgentShutdownHookResponse
>;
