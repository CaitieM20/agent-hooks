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
 * A wire adapter flattens agentContext and hookContext and supplies
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
export interface PreModelContext {
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
export interface PostModelContext {
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

// pre_tool_call payload: a wire adapter derives target from tool_call.args.
export interface PreToolContext<TArgs extends JsonObject = JsonObject> {
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: TArgs;
  };
}

// post_tool_call: a wire adapter derives target from tool_result.value.
export interface PostToolContext {
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

/**
 * Generic request envelope for a hook handler. `hookContext` is intentionally
 * untyped by default; hook-specific requests specialize it.
 */
export interface HooksRequest<TContext = object> {
  agentContext: AgentContext;
  hookContext: TContext;
}

/**
 * Generic response envelope. Shared verdict members remain optional as in the
 * existing verdict contract.
 */
export interface HooksResponse<TVerdict = Verdict> {
  verdict: TVerdict;
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
 * Current wire-shaped verdict union, included as the generic response default.
 * The pre-tool API specialization below replaces path/value with full args.
 */
export type Verdict = VerdictFields &
  (
    | { decision: "allow" }
    | { decision: "deny"; approval?: JsonObject }
    | { decision: "transform"; transform: Transform }
  );

/** Request specialization for a pre-tool handler. */
export interface PreToolHookRequest<
  TArgs extends JsonObject = JsonObject,
> extends HooksRequest<PreToolContext<TArgs>> {}

export type PreToolVerdict<TArgs extends JsonObject = JsonObject> =
  VerdictFields &
    (
      | { decision: "allow" }
      | { decision: "deny"; approval?: JsonObject }
      // API-level whole-args replacement; wire adaptation can use $target.
      | { decision: "transform"; transform: { args: TArgs } }
    );

/** Response specialization whose transform replaces the complete tool args. */
export interface PreToolHookResponse<
  TArgs extends JsonObject = JsonObject,
> extends HooksResponse<PreToolVerdict<TArgs>> {}

export type HooksHandler<
  TRequest extends HooksRequest = HooksRequest,
  TResponse extends HooksResponse = HooksResponse,
> = (request: TRequest) => TResponse | Promise<TResponse>;

export type PreToolHookHandler<
  TArgs extends JsonObject = JsonObject,
> = HooksHandler<PreToolHookRequest<TArgs>, PreToolHookResponse<TArgs>>;
