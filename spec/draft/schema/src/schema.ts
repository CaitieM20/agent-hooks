// Copyright (c) Microsoft. All rights reserved.

// Values that more than one schema states and that must agree between them.
// String enums keep their declaration order in the generated enum lists;
// a union of string literals would be alphabetised.

/** Enforcement modes (§8). */
export enum Mode {
  Enforce = "enforce",
  EvaluateOnly = "evaluate_only",
}

/** Composition profiles (§7.1), in §7.2 table order. */
export enum CompositionProfile {
  SequentialFirstDeny = "sequential/first_deny",
  SequentialRunAll = "sequential/run_all",
  ParallelStrictest = "parallel/strictest",
  ParallelUnanimous = "parallel/unanimous",
}

/** Values of the on_approval knob (§7.2). */
export enum OnApproval {
  Stop = "stop",
  Resume = "resume",
}

/** Values of the on_disagreement and on_transform_conflict knobs (§7.2). */
export enum ConflictResolution {
  Deny = "deny",
  Approval = "approval",
}

/**
 * Namespaced extensions (§4.6): any value under a key that follows the
 * namespace rule.
 * @propertyNames {"pattern": "^[a-z][a-z0-9_]*$"}
 */
export interface Extensions {
  [key: string]: unknown;
}

/**
 * The closed set of agent lifecycle interception points (AGENT-HOOKS-0.1 §3).
 * @title Agent Hooks — interception point
 */
export enum InterceptionPoint {
  AgentStartup = "agent_startup",
  Input = "input",
  PreModelCall = "pre_model_call",
  PostModelCall = "post_model_call",
  PreToolCall = "pre_tool_call",
  PostToolCall = "post_tool_call",
  Output = "output",
  AgentShutdown = "agent_shutdown",
}

// agent-context.schema.json and its per-point variants (§4). The master is
// the union of one variant per interception point; each variant requires that
// point's payload. spec/scripts/generate-schemas.mts derives the closed per-point
// files under generated/strict-contexts/ from the same variants.


/** Conditional payload of agent_startup (§4.2). */
export interface AgentInit {
  tools_registered: string[];
}

/** Who produced an input (§4.2). */
export enum InputRole {
  User = "user",
  System = "system",
  External = "external",
}

/** Conditional payload of input (§4.2). */
export interface Input {
  content: unknown;
  role: InputRole;
}

/** Conditional payload of pre_model_call and post_model_call (§4.2). */
export interface Model {
  id: string;
  vendor?: string;
  params?: object;
}

/** One message of the model request (§4.2). */
export interface Message {
  role: string;
  content: unknown;
}

/** One tool call the model asked for (§4.2). */
export interface ToolCallRequest {
  id?: string;
  name: string;
  args: object;
}

/** Conditional payload of post_model_call (§4.2). */
export interface Response {
  content: unknown;
  tool_calls: ToolCallRequest[];
  finish_reason: string;
}

/** Token usage of a model call (§4.3). */
export interface Usage {
  /** @minimum 0 */
  prompt_tokens?: number;
  /** @minimum 0 */
  completion_tokens?: number;
}

/** Conditional payload of pre_tool_call and post_tool_call (§4.2). */
export interface ToolCall {
  /** @minLength 1 */
  id: string;
  /** @minLength 1 */
  name: string;
  args: object;
  /** @pattern ^sha256:[0-9a-f]{64}$ */
  content_hash?: string;
}

/** Conditional payload of post_tool_call (§4.2). */
export interface ToolResult {
  value: unknown;
  is_error: boolean;
  /**
   * @TJS-type number
   * @minimum 0
   */
  duration_ms?: number;
}

/** One declared tool (§4.3). */
export interface ToolDecl {
  name: string;
  description?: string;
  schema?: object;
}

/** Conditional payload of output (§4.2). */
export interface Output {
  content: unknown;
}

/** Why the agent stopped (§4.2). */
export enum SummaryReason {
  Completed = "completed",
  Error = "error",
  Cancelled = "cancelled",
}

/**
 * Conditional payload of agent_shutdown (§4.2).
 */
export interface Summary {
  reason: SummaryReason;
  /** @minimum 0 */
  tool_calls?: number;
  /** @minimum 0 */
  errors?: number;
  /**
   * @TJS-type number
   * @minimum 0
   */
  duration_seconds?: number;
}

/** Who acts (§4.5). */
export enum ActorKind {
  Human = "human",
  Service = "service",
  Agent = "agent",
}

/**
 * Metadata available at every interception point.
 */
interface ContextMetadata {
  /**
   * This version's wire string (§4.1). A released version's contexts
   * carry that version's own string, agent-hooks/<major>.<minor>.
   */
  spec: "agent-hooks/draft";
  /** @format date-time */
  timestamp: string;
  /** @minimum 0 */
  sequence: number;
  agent: {
    /** @minLength 1 */
    id: string;
    /** @pattern ^[a-z0-9_-]+$ */
    framework: string;
    name?: string;
    version?: string;
  };
  session: {
    /** @minLength 1 */
    id: string;
    /** @format date-time */
    started_at?: string;
    /** @minimum 0 */
    turn?: number;
  };
  trace?: {
    trace_id?: string;
    span_id?: string;
  };
  tenant?: {
    id?: string;
    name?: string;
  };
  actor?: {
    id?: string;
    kind?: ActorKind;
  };
  budgets?: {
    /** @TJS-type number */
    tool_call_count?: number;
    /** @TJS-type number */
    token_count?: number;
    /** @TJS-type number */
    elapsed_seconds?: number;
    /** @TJS-type number */
    cost_usd?: number;
  };
}

export interface HooksRequest extends ContextMetadata {
  interception_point: InterceptionPoint;
  extensions?: Extensions;
}

/**
 * The request at agent_startup: agent_init is required (§4.2).
 * @example [agent-startup.json](../examples/AgentContext/agent-startup.json)
 */
export interface AgentStartupRequest extends HooksRequest {
  interception_point: InterceptionPoint.AgentStartup;
  agent_init: AgentInit;
}

/**
 * The request at input: input is required (§4.2).
 * @example [input.json](../examples/AgentContext/input.json)
 */
export interface InputRequest extends HooksRequest {
  interception_point: InterceptionPoint.Input;
  input: Input;
}

/**
 * The request at pre_model_call: model and messages are required (§4.2).
 * @example [pre-model-call.json](../examples/AgentContext/pre-model-call.json)
 * @example [pre-model-call-with-model-metadata.json](../examples/AgentContext/pre-model-call-with-model-metadata.json)
 * @example [pre-model-call-with-tools.json](../examples/AgentContext/pre-model-call-with-tools.json)
 */
export interface PreModelCallRequest extends HooksRequest {
  interception_point: InterceptionPoint.PreModelCall;
  model: Model;
  messages: Message[];
  tools?: ToolDecl[];
  request_id?: string;
}

/**
 * The request at post_model_call: model and response are required (§4.2).
 * @example [post-model-call.json](../examples/AgentContext/post-model-call.json)
 * @example [post-model-call-with-optional-tool-call-id.json](../examples/AgentContext/post-model-call-with-optional-tool-call-id.json)
 * @example [post-model-call-with-usage.json](../examples/AgentContext/post-model-call-with-usage.json)
 */
export interface PostModelCallRequest extends HooksRequest {
  interception_point: InterceptionPoint.PostModelCall;
  model: Model;
  response: Response;
  request_id?: string;
  usage?: Usage;
}

/**
 * The request at pre_tool_call: tool_call is required (§4.2).
 * @example [pre-tool-call.json](../examples/AgentContext/pre-tool-call.json)
 */
export interface PreToolCallRequest extends HooksRequest {
  interception_point: InterceptionPoint.PreToolCall;
  tool_call: ToolCall;
}

/**
 * The request at post_tool_call: tool_call and tool_result are required (§4.2).
 * @example [post-tool-call.json](../examples/AgentContext/post-tool-call.json)
 * @example [post-tool-call-error.json](../examples/AgentContext/post-tool-call-error.json)
 */
export interface PostToolCallRequest extends HooksRequest {
  interception_point: InterceptionPoint.PostToolCall;
  tool_call: ToolCall;
  tool_result: ToolResult;
}

/**
 * The request at output: output is required (§4.2).
 * @example [output.json](../examples/AgentContext/output.json)
 */
export interface OutputRequest extends HooksRequest {
  interception_point: InterceptionPoint.Output;
  output: Output;
}

/**
 * The request at agent_shutdown: summary is required (§4.2).
 * @example [agent-shutdown.json](../examples/AgentContext/agent-shutdown.json)
 */
export interface AgentShutdownRequest extends HooksRequest {
  interception_point: InterceptionPoint.AgentShutdown;
  summary: Summary;
}

/**
 * Payload a host constructs at each interception point (AGENT-HOOKS-0.1 §4).
 * Each variant requires its discriminator and own hook payload, with shared
 * metadata and optional namespaced extensions.
 * @title Agent Hooks — agent context
 */
export type AgentContext =
  | AgentStartupRequest
  | InputRequest
  | PreModelCallRequest
  | PostModelCallRequest
  | PreToolCallRequest
  | PostToolCallRequest
  | OutputRequest
  | AgentShutdownRequest;

// Shared decision types used by the hook-specific response schemas (§5).

/** The three decisions (§5). */
export enum Decision {
  Allow = "allow",
  Deny = "deny",
  Transform = "transform",
}

/**
 * A recorded concern that does not affect control flow (§5.1).
 * @additionalProperties false
 */
export interface Warning {
  /**
   * Interceptor-supplied warning identifier. The host_error: prefix is reserved
   * for host-synthesized failures (§11) and host_warning: for host-synthesized
   * warnings (§11.1); an interceptor warning with either prefix fails §5
   * validation.
   * @pattern ^(?!host_error:|host_warning:).*
   */
  reason?: string | null;
  message?: string | null;
}

/** Named URIs an auditor MAY consult. Hosts MUST NOT dereference automatically (§14). */
export interface VerificationPointers {
  [name: string]: string;
}

/**
 * Offline-verifiable evidence attached to a verdict (§14).
 * @additionalProperties false
 */
export interface Evidence {
  /** Content address (sha256:<hex>) or URI of an offline-verifiable proof. */
  artefact?: string | null;
  verification_pointers?: VerificationPointers;
}

/** Members every decision may carry. */
interface VerdictBase {
  /**
   * Interceptor-supplied machine identifier. The host_error: prefix is reserved
   * for host-synthesized failures (§11).
   * @pattern ^(?!host_error:).*
   */
  reason?: string | null;
  /** Human-readable text for the caller. */
  message?: string | null;
  /**
   * Recorded concerns that do not affect control flow (§5.1). Permitted on any
   * decision; unioned across an emission's verdicts (§7.3). Reasons starting with
   * host_warning: are reserved for the host (§11.1).
   */
  warnings?: Warning[] | null;
  evidence?: Evidence;
  /**
   * Interceptor-supplied labels the host MUST persist with the produced data and
   * resurface on later interception points (§5.4).
   */
  result_labels?: string[] | null;
}

/**
 * allow: proceed. Absorbs warn through warnings[] (§5.1).
 * @additionalProperties false
 * @example [allow.json](../examples/Verdict/allow.json)
 * @example [allow-with-warning.json](../examples/Verdict/allow-with-warning.json)
 * @example [allow-with-evidence.json](../examples/Verdict/allow-with-evidence.json)
 */
export interface AllowVerdict extends VerdictBase {
  decision: Decision.Allow;
}

/**
 * deny: stop the action. Absorbs escalate through the approval block (§5.1).
 * @additionalProperties false
 * @example [deny.json](../examples/Verdict/deny.json)
 * @example [deny-with-approval.json](../examples/Verdict/deny-with-approval.json)
 */
export interface DenyVerdict extends VerdictBase {
  decision: Decision.Deny;
  /**
   * Present only on deny: marks the deny as liftable by the approval seam (§9).
   * MAY be empty; reserved for approver-facing parameters.
   */
  approval?: object;
}

/**
 * transform: proceed with the hook-specific replacement payload.
 * @additionalProperties false
 * @example [transform-input.json](../examples/Verdict/transform-input.json)
 * @example [transform-messages.json](../examples/Verdict/transform-messages.json)
 * @example [transform-output.json](../examples/Verdict/transform-output.json)
 * @example [transform-response.json](../examples/Verdict/transform-response.json)
 * @example [transform-tool-args.json](../examples/Verdict/transform-tool-args.json)
 * @example [transform-tool-result.json](../examples/Verdict/transform-tool-result.json)
 */
export interface TransformVerdict<TTransform> extends VerdictBase {
  decision: Decision.Transform;
  transform: TTransform;
}

/** Verdict choices for hooks that do not support transforms. */
export type NonTransformVerdict = AllowVerdict | DenyVerdict;

/**
 * Interceptor return value (AGENT-HOOKS-0.1 §5). Three decisions: allow (absorbs
 * warn via warnings[]), deny (absorbs escalate via the approval block), transform.
 * A verdict carries decision content only; composition is host configuration
 * (§7.1).
 * @title Agent Hooks — verdict
 */
export type Verdict<TTransform> =
  | NonTransformVerdict
  | TransformVerdict<TTransform>;

// Hook response envelopes specialize the shared verdict's transform payload.


/**
 * Replaces the complete input payload.
 * @additionalProperties false
 */
export interface InputHookTransform {
  input: InputRequest["input"];
}

/**
 * Replaces the complete model-message array.
 * @additionalProperties false
 */
export interface PreModelHookTransform {
  messages: PreModelCallRequest["messages"];
}

/**
 * Replaces the complete model response payload.
 * @additionalProperties false
 */
export interface PostModelHookTransform {
  response: PostModelCallRequest["response"];
}

/**
 * Replaces the complete tool args for the pre-tool hook.
 * @additionalProperties false
 */
export interface PreToolHookTransform {
  args: PreToolCallRequest["tool_call"]["args"];
}

/**
 * Replaces only the value of the tool result.
 * @additionalProperties false
 */
export interface PostToolHookTransform {
  value: PostToolCallRequest["tool_result"]["value"];
}

/**
 * Replaces the complete output payload.
 * @additionalProperties false
 */
export interface OutputHookTransform {
  output: OutputRequest["output"];
}

/**
 * Hook response envelope with a hook-specific verdict.
 * @additionalProperties false
 */
export interface HookResponse<TVerdict> {
  verdict: TVerdict;
  extensions?: Extensions;
}

/** Responses for hooks that forbid transforms. */
export type HooksResponseNoTransform = HookResponse<NonTransformVerdict>;

/** Responses for hooks that allow a hook-specific transform. */
export type HooksResponseTransformSupported<TTransform> = HookResponse<Verdict<TTransform>>;

/**
 * agent_startup response: transforms are forbidden.
 * @example [allow.json](../examples/AgentStartupHookResponse/allow.json)
 * @example [deny.json](../examples/AgentStartupHookResponse/deny.json)
 * @example [allow-with-extensions.json](../examples/AgentStartupHookResponse/allow-with-extensions.json)
 */
export type AgentStartupHookResponse = HooksResponseNoTransform;

/**
 * input response.
 * @example [allow.json](../examples/InputHookResponse/allow.json)
 * @example [deny.json](../examples/InputHookResponse/deny.json)
 * @example [transform.json](../examples/InputHookResponse/transform.json)
 * @example [deny-with-extensions.json](../examples/InputHookResponse/deny-with-extensions.json)
 */
export type InputHookResponse = HooksResponseTransformSupported<InputHookTransform>;

/**
 * pre_model_call response.
 * @example [allow.json](../examples/PreModelHookResponse/allow.json)
 * @example [deny.json](../examples/PreModelHookResponse/deny.json)
 * @example [transform.json](../examples/PreModelHookResponse/transform.json)
 */
export type PreModelHookResponse = HooksResponseTransformSupported<PreModelHookTransform>;

/**
 * post_model_call response.
 * @example [allow.json](../examples/PostModelHookResponse/allow.json)
 * @example [deny.json](../examples/PostModelHookResponse/deny.json)
 * @example [transform.json](../examples/PostModelHookResponse/transform.json)
 */
export type PostModelHookResponse = HooksResponseTransformSupported<PostModelHookTransform>;

/**
 * pre_tool_call response.
 * @example [allow.json](../examples/PreToolHookResponse/allow.json)
 * @example [deny.json](../examples/PreToolHookResponse/deny.json)
 * @example [transform.json](../examples/PreToolHookResponse/transform.json)
 */
export type PreToolHookResponse = HooksResponseTransformSupported<PreToolHookTransform>;

/**
 * post_tool_call response.
 * @example [allow.json](../examples/PostToolHookResponse/allow.json)
 * @example [deny.json](../examples/PostToolHookResponse/deny.json)
 * @example [transform.json](../examples/PostToolHookResponse/transform.json)
 */
export type PostToolHookResponse = HooksResponseTransformSupported<PostToolHookTransform>;

/**
 * output response.
 * @example [allow.json](../examples/OutputHookResponse/allow.json)
 * @example [deny.json](../examples/OutputHookResponse/deny.json)
 * @example [transform.json](../examples/OutputHookResponse/transform.json)
 */
export type OutputHookResponse = HooksResponseTransformSupported<OutputHookTransform>;

/**
 * agent_shutdown response: transforms are forbidden.
 * @example [allow.json](../examples/AgentShutdownHookResponse/allow.json)
 * @example [deny.json](../examples/AgentShutdownHookResponse/deny.json)
 */
export type AgentShutdownHookResponse = HooksResponseNoTransform;

/** Synchronous handler for one hook request and its response contract. */
export type HookHandler<TRequest, TResponse> = (request: TRequest) => TResponse;

export type AgentStartupHookHandler = HookHandler<AgentStartupRequest, AgentStartupHookResponse>;
export type InputHookHandler = HookHandler<InputRequest, InputHookResponse>;
export type PreModelHookHandler = HookHandler<PreModelCallRequest, PreModelHookResponse>;
export type PostModelHookHandler = HookHandler<PostModelCallRequest, PostModelHookResponse>;
export type PreToolHookHandler = HookHandler<PreToolCallRequest, PreToolHookResponse>;
export type PostToolHookHandler = HookHandler<PostToolCallRequest, PostToolHookResponse>;
export type OutputHookHandler = HookHandler<OutputRequest, OutputHookResponse>;
export type AgentShutdownHookHandler = HookHandler<AgentShutdownRequest, AgentShutdownHookResponse>;

// approval.schema.json: the approval request and resolution shapes (§9).
// The file has no root type: validators reference its definitions by
// pointer, #/$defs/request and #/$defs/resolution. The tool names a
// definition after its type, so the two types below keep those names.


/**
 * The liftable deny being consulted: an interceptor's (passes §5,
 * verdict.schema.json) or the host-synthesized §7.5 shape, whose reason is a
 * reserved host_error:* string that §5 forbids interceptors to emit — so this
 * member is validated against the §5 schema only when its reason is not
 * host_error:*.
 */
export interface LiftableDeny {
  decision: Decision.Deny;
  [member: string]: unknown;
}

/**
 * What the host hands the resolver (§9).
 * @additionalProperties false
 * @example [collection-access.json](../examples/ApprovalRequest/collection-access.json)
 */
export interface request {
  context_identity: string | null;
  interception_point: InterceptionPoint;
  verdict: LiftableDeny;
  /** The AgentContext as presented to the resolver. MAY be redacted per host policy. */
  context?: AgentContext;
}

/** How a consultation ended (§9). */
export enum Outcome {
  Approve = "approve",
  Reject = "reject",
  Unresolved = "unresolved",
}

interface ResolutionBase {
  /**
   * MUST equal the request's context_identity byte for byte (echo rule, §9);
   * null echoes as null.
   */
  context_identity: string | null;
}

/**
 * approve: the resolver lifts the deny with an allow verdict.
 * @additionalProperties false
 * @example [approve-allow.json](../examples/ApprovalResolution/approve-allow.json)
 */
export interface ApproveResolution extends ResolutionBase {
  outcome: Outcome.Approve;
  verdict: AllowVerdict;
}

/**
 * reject: the resolver keeps a deny.
 * @additionalProperties false
 * @example [reject.json](../examples/ApprovalResolution/reject.json)
 */
export interface RejectResolution extends ResolutionBase {
  outcome: Outcome.Reject;
  verdict: DenyVerdict;
}

/**
 * unresolved: no decision; the deny stands and no verdict is carried.
 * @additionalProperties false
 * @example [unresolved.json](../examples/ApprovalResolution/unresolved.json)
 */
export interface UnresolvedResolution extends ResolutionBase {
  outcome: Outcome.Unresolved;
}

/** What the resolver returns (§9). */
export type resolution = ApproveResolution | RejectResolution | UnresolvedResolution;

// interception-record.schema.json: the host-side record of one emission (§10.3).


/**
 * Presence only; members are stripped by the projection.
 * @additionalProperties false
 */
export interface ApprovalPresence {}

/**
 * A payload-free projection of the combined verdict (§10.3): transform
 * details are omitted, approval members stripped, messages truncated to
 * 256 UTF-8 bytes.
 * warnings[].reason may carry host_warning:control_failed (§6.3.1, §11.1).
 * @additionalProperties false
 */
export interface VerdictProjection {
  decision: Decision;
  reason?: string | null;
  message?: string | null;
  warnings?: WarningProjection[] | null;
  evidence?: Evidence;
  result_labels?: string[] | null;
  approval?: ApprovalPresence;
}

/**
 * Warning metadata retained in a payload-free record projection.
 * @additionalProperties false
 */
export interface WarningProjection {
  reason?: string | null;
  message?: string | null;
}

/**
 * W3C Trace Context identifiers echoed from the context's optional trace block
 * (§4.5, §10.3).
 * @additionalProperties false
 */
export interface Trace {
  trace_id?: string;
  span_id?: string;
}

/** The host_error reasons a continue posture may substitute for (§6.3.1). */
export enum SubstitutedFor {
  InterceptorFailed = "host_error:interceptor_failed",
  InterceptorTimeout = "host_error:interceptor_timeout",
  VerdictInvalid = "host_error:verdict_invalid",
}

/**
 * Payload-free summary of one interceptor's verdict (§10.3).
 * @additionalProperties false
 */
export interface VerdictSlot {
  /** @minimum 0 */
  index: number;
  decision: Decision;
  reason?: string | null;
  /** Host-chosen payload-free registration identifier for the interceptor at index (§10.3). */
  name?: string;
  /**
   * Present iff this slot's verdict is the allow the host substituted under
   * on_error: continue (§6.3.1): the host_error reason the §6.3 deny would have
   * carried. The entry's decision is allow and reason is absent.
   */
  substituted_for?: SubstitutedFor;
}

/** Consultation outcomes a record names (§7.6). */
export enum ResolvedBy {
  Approval = "approval",
  Rejection = "rejection",
}

/**
 * Host-side record of one emission (AGENT-HOOKS-0.1 §10.3). Payload-free:
 * identities (when a provider is declared) bind the record to the exact
 * pre/post-composition context; session_id/sequence/decided_by provide ordering
 * and attribution; composition makes the record interpretable without
 * out-of-band host configuration.
 *
 * Two rules relate members and cannot be typed, so they are written as JSON
 * Schema in the allOf tag below and copied through by the generator: verdicts
 * is REQUIRED under the multi-verdict profiles (§7.4), and the identities are
 * null when identity_provider is null (§10.3).
 * @example [allow.json](../examples/InterceptionRecord/allow.json)
 * @example [approved-transform.json](../examples/InterceptionRecord/approved-transform.json)
 * @example [continued-after-timeout.json](../examples/InterceptionRecord/continued-after-timeout.json)
 * @title Agent Hooks — interception record
 * @additionalProperties false
 * @allOf [{"if": {"properties": {"composition": {"type": "object", "properties": {"profile": {"enum": ["sequential/run_all", "parallel/strictest", "parallel/unanimous"]}}}}}, "then": {"required": ["verdicts"]}}, {"description": "§10.3: identities are null when identity_provider is null.", "if": {"properties": {"identity_provider": {"const": null}}}, "then": {"properties": {"input_identity": {"const": null}, "enforced_identity": {"const": null}}}}]
 */
export interface InterceptionRecord {
  interception_point: InterceptionPoint;
  mode: Mode;
  verdict: VerdictProjection;
  /** Identity provider output on the context before dispatch; null iff identity_provider is null. */
  input_identity: string | null;
  /** Identity provider output after composition completes; null iff identity_provider is null. */
  enforced_identity: string | null;
  /**
   * The declared identity provider (§10.1): "jcs-sha256", a host-defined id
   * (name rules enforced: ^[a-z][a-z0-9_-]*$ and never a jcs prefix), or null
   * (identity-unbound).
   * @pattern ^(jcs-sha256|(?!jcs)[a-z][a-z0-9_-]*)$
   */
  identity_provider: string | null;
  /** ctx.session.id — correlates records across a session. */
  session_id: string;
  /** ctx.sequence — total order of records within the session (§12.2.3). */
  sequence: number;
  /**
   * OPTIONAL. The context's RFC 3339 timestamp, copied verbatim (§10.3); absent
   * when the context lacked the field.
   */
  timestamp?: string;
  /**
   * OPTIONAL. W3C Trace Context identifiers echoed from the context's optional
   * trace block (§4.5, §10.3); absent when the context carried neither member.
   */
  trace?: Trace;
  /**
   * Registration index of the interceptor whose verdict won aggregation or whose
   * liftable deny was consulted (§7.6); null for a pure-allow combination or a
   * host-synthesized verdict.
   * @minimum 0
   */
  decided_by?: number | null;
  /**
   * The composition profile and knobs in effect for this emission (§7.1).
   * @additionalProperties false
   */
  composition: {
    profile: CompositionProfile;
    on_approval?: OnApproval;
    on_disagreement?: ConflictResolution;
    on_transform_conflict?: ConflictResolution;
  };
  /**
   * Payload-free per-interceptor summary. REQUIRED in multi-verdict profiles
   * (sequential/run_all, parallel/*) and whenever any slot carries
   * substituted_for (§6.3.1); otherwise OPTIONAL in sequential/first_deny.
   */
  verdicts?: VerdictSlot[];
  /**
   * true iff one or more registered interceptors were never invoked in this
   * emission (short-circuit, approval-stop, or a failed fold-transform). Defined
   * for the sequential profiles (§7.4).
   */
  fold_truncated?: boolean;
  /**
   * Consultation outcome (§7.6, §10.3): "approval" iff a permit resolution
   * substituted for a verdict; "rejection" iff the seam was consulted and did not
   * lift the deny; absent/null iff never consulted.
   */
  resolved_by?: ResolvedBy | null;
  /**
   * Number of interceptors registered at emission time (§10.3).
   * @minimum 0
   */
  interceptors_registered: number;
}

// host-declaration.schema.json: the specification's host declaration (§7.7).


/**
 * Grammar of a registered name: provider, resolver, redactor or binding id.
 * @pattern ^[a-z][a-z0-9_-]{0,63}$
 */
export type Reference = string;

/**
 * A bound in milliseconds; null is unbounded.
 * @minimum 1
 * @maximum 3600000
 */
export type TimeoutMs = number | null;

/**
 * The conformance capability vocabulary (§13.1, conformance/draft/vectors.schema.json)
 * less buffered_output, which is the boolean surface member, plus
 * host_declaration.
 */
export enum Capability {
  ModelCalls = "model_calls",
  ToolCalls = "tool_calls",
  ParallelToolCalls = "parallel_tool_calls",
  Streaming = "streaming",
  MultiTurn = "multi_turn",
  Int64Json = "int64_json",
  BigintJson = "bigint_json",
  IncrementalOutput = "incremental_output",
  HostDeclaration = "host_declaration",
}

/** The tool-seam posture a host implements (§13.1). */
export enum ToolSeamHostError {
  Continue = "continue",
  Terminate = "terminate",
}

/** The failure posture (§6.3.1). */
export enum OnError {
  Deny = "deny",
  Continue = "continue",
}

/**
 * OPTIONAL and informative; never checked against code.
 * @additionalProperties false
 */
export interface Host {
  /**
   * Same grammar as agent.framework (§4.1).
   * @pattern ^[a-z0-9_-]{1,64}$
   */
  name: string;
  /**
   * @minLength 1
   * @maxLength 64
   */
  version?: string;
}

/**
 * §7.2. A knob the declared profile does not consult is refused, never cleared;
 * a consulted knob left unset takes the §7.2 default.
 * @additionalProperties false
 */
export interface CompositionConfig {
  /** @default "sequential/first_deny" */
  profile?: CompositionProfile;
  /** Consulted by sequential/first_deny only; refused under any other profile (§7.7.3). */
  on_approval?: OnApproval;
  /** Consulted by parallel/unanimous only. */
  on_disagreement?: ConflictResolution;
  /** Consulted by parallel/strictest only. */
  on_transform_conflict?: ConflictResolution;
}

/** @additionalProperties false */
export interface ApprovalConfig {
  /**
   * §9. A registered approval resolver by reference, or null: liftable denies
   * stay denies.
   * @pattern ^[a-z][a-z0-9_-]{0,63}$
   */
  resolver?: string | null;
  /**
   * §9 redaction seam. A registered approval redactor by reference, or null.
   * @pattern ^[a-z][a-z0-9_-]{0,63}$
   */
  redactor?: string | null;
}

/** @additionalProperties false */
export interface PostureConfig {
  /**
   * §13.1. Must equal the posture the host's code implements.
   * @default "continue"
   */
  tool_seam_host_error?: ToolSeamHostError;
}

/** @additionalProperties false */
export interface TimeoutsConfig {
  /** §7 interceptor bound; default 5000. null means unbounded and must be written out. */
  interceptor_ms?: TimeoutMs;
  /** §9 resolver bound; defaults to the value of interceptor_ms. */
  approval_resolver_ms?: TimeoutMs;
}

/** @additionalProperties false */
export interface RecordsConfig {
  /**
   * In-memory record buffer bound; null (the default) is unbounded. The maximum
   * is 2^53 - 1 so the resolved document always canonicalises (§4.4).
   * @minimum 1
   * @maximum 9007199254740991
   */
  max_buffered?: number | null;
}

/** @additionalProperties false */
export interface FailureConfig {
  /**
   * §6.3.1. The document default every binding's on_error inherits. deny keeps
   * the §6.3 substituted deny; continue substitutes an allow carrying
   * host_warning:control_failed and records the cause in substituted_for.
   * @default "deny"
   */
  on_error?: OnError;
}

/**
 * Host configuration (§7.1). Every member is OPTIONAL; defaults are the values
 * the specification already names and fail closed.
 * @additionalProperties false
 */
export interface Configuration {
  /**
   * §8.
   * @default "enforce"
   */
  mode?: Mode;
  composition?: CompositionConfig;
  /**
   * §10.1: "jcs-sha256" (the default), a registered custom provider name
   * (^[a-z][a-z0-9_-]{0,63}$, never a jcs prefix), or null (identity-unbound).
   * @pattern ^(jcs-sha256|(?!jcs)[a-z][a-z0-9_-]{0,63})$
   */
  identity_provider?: string | null;
  approval?: ApprovalConfig;
  posture?: PostureConfig;
  timeouts?: TimeoutsConfig;
  records?: RecordsConfig;
  failure?: FailureConfig;
}

/** @additionalProperties false */
export interface FirstDenySupport {
  /**
   * @uniqueItems true
   * @minItems 1
   */
  on_approval?: OnApproval[];
}

/** @additionalProperties false */
export interface RunAllSupport {}

/** @additionalProperties false */
export interface StrictestSupport {
  /**
   * @uniqueItems true
   * @minItems 1
   */
  on_transform_conflict?: ConflictResolution[];
}

/** @additionalProperties false */
export interface UnanimousSupport {
  /**
   * @uniqueItems true
   * @minItems 1
   */
  on_disagreement?: ConflictResolution[];
}

/**
 * Profiles and the knob values supported under each (§13.1). Only the knobs a
 * profile consults may appear; an absent knob member means the §7.2 default
 * value only.
 * @additionalProperties false
 */
export interface ProfileSupport {
  "sequential/first_deny"?: FirstDenySupport;
  "sequential/run_all"?: RunAllSupport;
  "parallel/strictest"?: StrictestSupport;
  "parallel/unanimous"?: UnanimousSupport;
}

interface SurfaceBase {
  /**
   * Points the host emits; always includes agent_startup, input, output and
   * agent_shutdown (§3.2), and omits the model or tool points only in pairs.
   * @uniqueItems true
   * @minItems 4
   * @maxItems 8
   */
  interception_points?: InterceptionPoint[];
  /** @uniqueItems true */
  capabilities?: Capability[];
  profiles?: ProfileSupport;
}

/**
 * The surface of a host that buffers output (§12.1a), the default:
 * exposure_bound is absent.
 * @additionalProperties false
 */
export interface BufferedSurface extends SurfaceBase {
  /**
   * §12.1a. false must be declared explicitly and requires exposure_bound.
   * @default true
   */
  buffered_output?: true;
}

/**
 * The surface of a host that streams output (§12.1a): buffered_output is
 * written as false and exposure_bound is present.
 * @additionalProperties false
 */
export interface UnbufferedSurface extends SurfaceBase {
  /** §12.1a. false must be declared explicitly and requires exposure_bound. */
  buffered_output: false;
  /**
   * §12.1a. Present iff buffered_output is false.
   * @minLength 1
   * @maxLength 512
   */
  exposure_bound: string;
}

/** The declared surface (§13.1) in file form, by output posture. */
export type Surface = BufferedSurface | UnbufferedSurface;

/**
 * One interceptor binding (§7.7.4).
 * @additionalProperties false
 */
export interface Binding {
  /** Unique in the array; stamped on verdicts[].name (§10.3). */
  id: Reference;
  /**
   * A lookup key into the host's kind registry and nothing more: never a path,
   * class name, URL or module the loader interprets. At least one dot, so every
   * kind carries a namespace the host controls. The first segments agent_hooks
   * and ctk are reserved. This specification defines no kinds.
   * @pattern ^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$
   * @maxLength 128
   */
  kind: string;
  /**
   * Kind-specific; handed to the kind resolver unchanged. The loader interprets
   * none of it; its one check here is the document-wide integer bound of §7.7.6
   * (no integer token above 2^53 - 1, so the resolved form canonicalises).
   * Default {}.
   */
  config?: unknown;
  /**
   * Points this binding runs at, each in the surface. Default: every surface
   * point.
   * @uniqueItems true
   * @minItems 1
   */
  at?: InterceptionPoint[];
  /** Per-binding bound. Default: configuration.timeouts.interceptor_ms; null is unbounded. */
  timeout_ms?: TimeoutMs;
  /**
   * §6.3.1 failure posture for this binding: what the host does when the
   * interceptor raises, times out or returns an invalid verdict. Default:
   * configuration.failure.on_error.
   */
  on_error?: OnError;
}

/**
 * A host declaration document (AGENT-HOOKS-0.1 §7.7): one JSON object that
 * fixes a host's configuration (§7.1, §8, §10.1, §13.1), its declared surface
 * (§13.1) and its interceptor bindings. The document's spec member selects
 * its format and behavior; this file describes agent-hooks/draft. Every object is
 * closed except bindings[].config and the values under extensions. This schema
 * is self-contained so a settings validator can use it alone. Rules it cannot
 * express (knob consistency, the §3.2 floor, surface against the host's code,
 * registered names) live in the loader (§7.7.6).
 * @example [document-policy.json](../examples/HostDeclaration/document-policy.json)
 * @example [default-failure-posture.json](../examples/HostDeclaration/default-failure-posture.json)
 * @example [failure-posture.json](../examples/HostDeclaration/failure-posture.json)
 * @example [streaming-document-policy.json](../examples/HostDeclaration/streaming-document-policy.json)
 * @title Agent Hooks — host declaration document (agent-hooks/draft)
 * @additionalProperties false
 */
export interface HostDeclaration {
  configuration?: Configuration;
  /**
   * Ordered: array order is dispatch order. REQUIRED, so an empty-deny host
   * (zero bindings) is written down rather than arrived at by omission. Binding
   * ids are unique.
   * @maxItems 256
   */
  bindings: Binding[];
  /** Ignored by the loader; kept for editors. */
  $schema?: string;
  /**
   * REQUIRED. The specification version the document is written for
   * (§7.7.3, §7.7.6): this version's wire string. A document written for a
   * released version names that version's own string instead, and is
   * read by that version's rules.
   */
  spec: "agent-hooks/draft";
  /**
   * OPTIONAL. An operator label for logs. Never stamped on records.
   * @pattern ^[a-z0-9][a-z0-9._-]{0,63}$
   */
  id?: string;
  host?: Host;
  /**
   * The declared surface (§13.1) in file form. OPTIONAL: when absent the host's
   * own code surface applies. Every stated member must be a subset of what the
   * host's code reports; a document a conformance claim cites carries this block
   * explicitly.
   */
  surface?: Surface;
  /**
   * Host-specific extras, kept verbatim and never read by the loader. Keys
   * follow the §4.6 namespace rule; the §4.6 reserved namespaces apply.
   */
  extensions?: Extensions;
}
