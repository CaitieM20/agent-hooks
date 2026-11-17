# P-XXX: Required Context for Hooks
- **Status:** Draft
- **Created:** 2026-11-12
- **Author(s):** Caitie McCaffrey (@CaitieM20)
- **PR:** (https://github.com/responsibleai/agent-hooks/pull/xxx)


## Abstract

Each `HooksRequest` includes `ContextMetadata`in addition to the Per Hook specific data. The current contract defines fields that cannot always be populated with meaningful data. For instance an AI Gateway doesn't know what agent framework is making the request or what sequence in the agent's execution the request belongs to. 

This proposal re-evaluates the common set of context fields required across hooks, based on feedback from early implementations. The goal is to get to a common core that contains meaningful data that can consistently be set at multiple layers of the stack (harness, agent runtime, AI Gateway).

Additionally this proposal moves identity fields to a separate `IdentityContext` object.

## The gap (Motivation)

The current contract is inadequate because it requires context fields that
cannot always be populated with meaningful data. This affects implementers
at multiple layers of the stack, including harnesses, agent runtimes, and
AI Gateways. 

Today implementors populate the required fields with garbage or meaningless values. Given the unreliability of these fields hook implementors cannot rely on them to make decisions. This either leads to Hook implementations that work inconsistently across surfaces, or passing fields that are commonly ignored.

Today identity data like `agent.id` and `tenant.id` is part of the common `ContextMetadata`. This implies that the same identity fields are available to hook implementers as ordinary request metadata, rather than as a separate identity context, and should be handled with the same level of trust. 

We propose making established agent and tenant identity available to hook implementers
through a separate, optional identity context, with the same semantics for local
and remote execution. Hook Implementors are responsible for ensuring this data gets populated from trustworthy sources, before the hook is invoked. 

## Specification

Section 4.1 defines required and optional context fields. The table below
describes the proposed disposition of each field. In the current draft,
`agent.id` is required; `tenant.*` and `actor.*` are already optional.

This proposal takes the existing `Context Metadata` fields and proposes which fields to keep, remove, or move to a separate identity context. The below table gives a high level overview. 

| Field | Continue to Support | Rationale |
| ---  | --- | --- |
| `spec`  | Keep | Identifies the context wire format version; hosts validate each context by the version it names. |
| `interception_point` | Keep | Identifies the hook interception point; necessary for remote hook execution. |
| `timestamp` | Keep | Identifies when the context was created. |
| `sequence` | Remove | May be known at the harness, but cannot be known at other execution layers. Moreover this is creating a false session, which should not be relied upon. | 
| `agent.id` | Move to a separate, optional identity context | Expose the established agent/workload security principal when available. This is different from today's stable agent-definition identifier; do not silently reinterpret that identifier as authenticated identity. Ordinary request metadata is not proof of identity. |
| `agent.framework` | Update | This field is meant to identify the runtime invoking the hook. This may be an agent harness, gateway, or agent runtime layer |
| `agent.name` | Remove | This field doesn't make sense outside the context of an agent harness |
| `agent.version` | Update | This field is meant to identify the version of the runtime invoking the hook, this may be an agent, harness, gateway, or agent runtime layer |
| `session.id` | Remove | Unlikely to be known at other execution layers, Moreover this is creating a false session, which hook implementors cannot rely upon, since there ar eno clear semantics around session create |
| `session.started_at` | Remove | same issues as session id. | 
|`session.turn` | Remove | same issue as session id. |
| `trace.trace_id`, `trace.span_id` | Keep | support distributed tracing across execution layers is useful especially in remote. |
|`tenant.id`, `tenant.name` | Move tenant identity out of `HooksRequest` | Expose an established, scoped tenant identifier through the optional identity context. Tenancy is vendor-neutral, but its mapping is provider/profile-specific. A display name is not an authorization identifier. |
|`actor.id`, `actor.kind` | Remove | Caller authentication belongs to the transport's admission policy, not the hook's agent identity. Delegation, when needed to establish agent identity, is validated through an authentication profile rather than a generic hook actor field. |
| `budgets.tool_call_count`, `budgets.token_count`, `budgets.elapsed_seconds`, `budgets.cost_usd` | keep or make extension... | This should move to an extension, having these as optional makes it difficult for hook implementors to rely on them consistently|

## Schema Changes

Each `HooksRequest` extends `ContextMetadata`. The `ContextMetadata` object will be updated to reflect the field changes described above.
```typespec
interface ContextMetadata {
  spec: "agent-hooks/draft";
  /** @format date-time */
  timestamp: string
  agent: {
    /** @minLength 1 */
    id: string;
    /** @pattern ^[a-z0-9_-]+$ */
    framework: string;
    name?: string;
    version?: string;
  };
  trace?: {
    trace_id?: string;
    span_id?: string;
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
```

Additionally we will add a new `IdentityContext` object to `HooksRequest` to carry the established agent and tenant identities.

```typespec
interface IdentityContext {
  /** Established agent/workload principal, not a logical agent or gateway. */
  agent?: {...};
  /** Established tenancy reference with a documented issuer/profile mapping. */
  tenant?: {...};
}
// Both members are independently optional; an empty context is valid.
// Only a trusted producer establishes and binds this context to an invocation.
// Missing identity stays absent; request JSON does not establish identity.
```

The `HooksRequest` object now looks as follows:
```typespec
interface HooksRequest extends ContextMetadata {
  interception_point: InterceptionPoint;
  identity_context?: IdentityContext;
  extensions?: Extensions;
}
```

### IdentityContext
Hooks may need to evaluate an action in the context of the established agent and tenant identities. The IdentityContext object provides a common datastructure to carry the identifiers. It MUST NOT be treated as proof of identity based solely on request JSON.

| Identity member | Meaning | Availability |
| --- | --- | --- |
| `agent` | The established agent/workload security principal whose action is being evaluated.| Optional. |
| `tenant` | An established tenancy/security-partition identifier, scoped according to its identity profile. | Optional, independently of `agent`. |

**Open Question: Should we include Tenant. Is this generic enough or specific to Microsoft.**


The below table describes how a local vs a remote implementation of an agent hook may populate the `IdentityContext` object.

| Member | Authority | Local basis (example) | Remote basis (example) |
| --- | --- | --- | --- |
| `agent` | The identity system that issued or registered the agent principal, such as an OAuth/OIDC issuer, workload identity issuer, or agent directory. | The host's configured agent registration, or a credential the host already validated. | A validated token whose issuer (`iss`) qualifies its subject (`sub`) when the profile defines that subject as an agent, or a SPIFFE ID, which includes its trust domain. |
| `tenant` | The system that assigns or attests tenancy, such as a directory, identity provider, or platform account system, as defined by the identity profile. The authority is not itself the tenant, and one authority can attest many tenants. | Host tenant configuration or an authenticated session. | A tenant claim defined by the accepted profile, from an issuer trusted to assert that tenant. |

### Remote Call Implications
The following remote exchange is illustrative only; it is not proposed syntax.
The identity evidence travels in the transport, and the request body carries
action data without an identity member:

```http
POST /hooks/evaluate HTTP/1.1
Host: hooks.example.com
Authorization: Bearer <access token issued for this hook service's audience>
Content-Type: application/json

{ ...HooksRequest: action data only, no identity member... }
```

The receiving adapter validates the token according to its profile (issuer,
signature, audience, lifetime, and any sender binding). It applies the
profile's agent and tenant mappings, constructs a new identity context, and
invokes `evaluate(hook_request, identity_context)`. An in-process host
constructs the same conceptual context from identity it has already
established, without an artificial network credential.


## Rationale

Hook policy should have a common way to consume available agent and tenant
identity without every hook becoming an authentication implementation.
Separating trusted construction from policy consumption supports harnesses,
agent runtimes, and gateways without pretending they all know the same facts.
It also avoids confusing a service's authenticated network caller with the agent
whose action is under evaluation.

### Options considered

#### A. Keep identity metadata, possibly as advisory hints

Keeping existing fields is inexpensive for hosts and hooks; making them optional
and explicitly unverified avoids forcing invented values. Hints can support
correlation at any layer, but have no independent verifier and can be spoofed.
They cannot serve as authentication or authorization evidence, and logging
them still creates privacy risks. This does not satisfy identity-aware policy.

#### B. Rely entirely on transport authentication or local host trust

A remote service authenticates credentials issued by a configured authorization
server or CA; local hooks rely on trusted registration and host state.
This keeps authentication out of the request and minimizes hook-specific work.
Audience/lifetime restrictions and credential protection remain necessary,
especially for bearer tokens. However, it supplies no common identity interface
to hooks, and an authenticated runtime or gateway does not necessarily identify
the agent or tenant behind it.

#### C. Put an opaque credential in every identity-bearing request

A token service could issue a credential that each hook verifies.
[OAuth Token Exchange, RFC 8693](https://www.rfc-editor.org/rfc/rfc8693.html)
supports subject/actor delegation. The
[OAuth Transaction Tokens draft](https://www.ietf.org/archive/id/draft-ietf-oauth-transaction-tokens-11.html)
explores short-lived identity and authorization context across a call chain
within a trust domain; it is work in progress, not an adopted dependency here.

This can propagate evidence across layers, but burdens consumers with
verification and key/issuer configuration. Putting credentials in ordinary
hook data also increases exposure through copies, logs, and forwarding.
Signatures do not provide confidentiality or prevent bearer replay.
Prefer verification in a trusted adapter, with hook-appropriate audiences and
normalized identity passed to policy code, rather than a token field in
`HooksRequest`.

#### D. Separate identity context with optional authentication

Trusted local providers and receiving remote adapters establish the same
conceptual agent/tenant context. Hooks consume identities without handling
credentials, and layers lacking authoritative information leave fields absent.
Existing OAuth or workload identity mechanisms can be used without mandating
one provider or introducing a new token format.

The cost moves to host/adapter integration and well-defined profiles.
Schema validation alone cannot enforce the trust boundary, and interoperable
identity-reference syntax and claim mappings still need agreement.

### Recommendation (for discussion)

Prefer **D**, using existing transport authentication and identity standards
where appropriate. Expose optional established agent/workload and tenant
identity context. Each value is qualified by its authority: the issuer or registry of the agent
principal, and the system that assigns or attests the tenant. Locally, the
trusted host establishes it; remotely, the receiver derives it only from
credentials it validates on the wire.

Keep authentication optional at the protocol level, with deployment-specific
admission requirements and mandatory validation whenever credentials establish
identity.

This preserves a small hook-facing contract without making every implementer
manage tokens. It does not resolve identity-reference syntax or define a
universal tenant mapping.

### Related decisions (optional)

- [Current draft](../../spec/draft/AGENT-HOOKS-DRAFT.md): sections 1.4
  (trusted host), 4.1 (metadata), 7 and 7.7.5 (remote services and resolver
  responsibility), 6.3.1 (failure posture), and 9-10 (approval/content binding).
- [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization):
  optional authorization support with conditional requirements built on existing
  standards, and different treatment of HTTP and local STDIO transports.
- [A2A Agent Cards](https://a2a-protocol.org/v0.3.0/specification/):
  endpoint/capability discovery and authentication requirements do not replace
  authentication of individual requests.
- Vendor offerings illustrate different integrations, not a common identity
  schema: [Microsoft Entra Agent ID](https://learn.microsoft.com/en-us/entra/agent-id/agent-identities)
  uses directory-scoped agent principals;
  [AWS AgentCore Identity](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/identity.html)
  provides workload identity and credential management; and
  [Google Agent Identity](https://docs.cloud.google.com/iam/docs/agent-identity-overview)
  uses SPIFFE-based agent identity and delegated credentials.

## Security and privacy

**Provenance and tenant isolation.** When using credentials, a producer MUST
establish both the credential's validity and the issuer's authority to assert the relevant
identities. Authentication of a shared gateway is not authority to name any
agent or tenant. Forwarded identity headers require an explicitly trusted,
authenticated proxy boundary that strips client-spoofable values. Identity
does not grant access by itself: policy must relate the established tenant to
the actual resource/action and the applicable authorization rules.

**Credential validation.** Use the selected profile's verification mechanism,
including signature verification or introspection where applicable, accepted
credential types and issuers, intended audiences, time bounds, scopes, and any
sender binding. A decoded JWT is not a validated JWT. Do not fetch arbitrary
issuer/key URLs from untrusted input. The
[JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html)
address audience/type confusion and untrusted key references.

**Failure handling.** Legitimate absence of an optional identity is not a
validation failure, but a policy requiring it must deny. Errors in identity
processing, including invalid credentials, failure to establish required
identity, and remote authentication rejection, MUST follow the hook's configured
`on_error` behavior. Under `on_error: continue`, these errors fail open, just as
interceptor exceptions, timeouts, and invalid responses do under section 6.3.1.
The local adapter must route remote authentication rejection through the same
error-handling path. 

## Backward compatibility

This is a breaking change as it removes fields from the existing HookRequest. This change should have minimal impact as existing known implementations are omitting these fields or providing junk data when they are required. 

