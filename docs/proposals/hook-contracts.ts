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

// agent_startup: a wire adapter derives target from agent_init.
export interface AgentStartupContext {
  agent_init: {
    tools_registered: string[];
  };
}

// input: a wire adapter derives target from input, not content alone.
export interface InputContext {
  input: {
    content: JsonValue;
    role: "user" | "system" | "external";
  };
}

// pre_model_call: a wire adapter derives target from messages, not model.
export interface PreModelContext {
  model: {
    id: string;
  };
  messages: {
    role: string;
    content: JsonValue;
  }[];
}

// post_model_call: a wire adapter derives target from the entire response.
export interface PostModelContext {
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

// pre_tool_call payload: a wire adapter derives target from tool_call.args.
export interface PreToolContext {
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
}

// Request composition keeps shared metadata beside the hook-specific payload.
export interface PreToolHookRequest
  extends HooksRequest,
    PreToolContext {}

// post_tool_call: a wire adapter derives target from tool_result.value.
export interface PostToolContext {
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
  output: {
    content: JsonValue;
  };
}

// agent_shutdown: a wire adapter derives target from summary.
export interface AgentShutdownContext {
  summary: {
    reason: "completed" | "error" | "cancelled";
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

export interface AgentStartupHookRequest
  extends HooksRequest,
    AgentStartupContext {}

export interface InputHookRequest extends HooksRequest, InputContext {}

export interface PreModelHookRequest
  extends HooksRequest,
    PreModelContext {}

export interface PostModelHookRequest
  extends HooksRequest,
    PostModelContext {}

export interface PostToolHookRequest
  extends HooksRequest,
    PostToolContext {}

export interface OutputHookRequest extends HooksRequest, OutputContext {}

export interface AgentShutdownHookRequest
  extends HooksRequest,
    AgentShutdownContext {}

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
 * Current wire-shaped verdict union, included as the generic response default.
 */
export type Verdict = VerdictFields &
  (
    | { decision: "allow" }
    | { decision: "deny"; approval?: JsonObject }
    | { decision: "transform"; transform: Transform }
  );

/** Generic response envelope; specialized responses narrow `verdict`. */
export interface HooksResponse<TVerdict = Verdict> {
  verdict: TVerdict;
}

/**
 * Allow/deny retain the shared verdict fields. At this API level, transform
 * replaces the complete tool args rather than carrying a wire path/value patch.
 */
export type PreToolVerdict = VerdictFields &
  (
    | { decision: "allow" }
    | { decision: "deny"; approval?: JsonObject }
    | { decision: "transform"; transform: { args: JsonObject } }
  );

/** Response specialization whose transform replaces the complete tool args. */
export interface PreToolHookResponse
  extends HooksResponse<PreToolVerdict> {}

export type HooksHandler<
  TRequest extends HooksRequest = HooksRequest,
  TResponse extends HooksResponse = HooksResponse,
> = (request: TRequest) => TResponse | Promise<TResponse>;

export type PreToolHookHandler = HooksHandler<
  PreToolHookRequest,
  PreToolHookResponse
>;
