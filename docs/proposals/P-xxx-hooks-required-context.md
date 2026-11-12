# P-XXX: Required Context for Hooks
- **Status:** Draft
- **Created:** 2026-11-12
- **Author(s):** Caitie McCaffrey (@CaitieM20)
- **PR:** (https://github.com/responsibleai/agent-hooks/pull/xxx)


## Abstract

Each `HooksRequest` includes common context metadata in addition to the Per Hook specific data. The current contract defines fields that cannot always be populated with meaningful data. For instance an AI Gateway doesn't know what agent framework is making the request or what sequence in the agent's execution the request belongs to. 

This proposal re-evaluates the common set of context fields required across hooks, based on feedback from early implementations. The goal is to get to a common core that contains meaningful data that can consistently be set at multiple layers of the stack (harness, agent runtime, AI Gateway).

## The gap (Motivation)

The current contract is inadequate because it requires context fields that
cannot always be populated with meaningful data. This affects implementers
at multiple layers of the stack, including harnesses, agent runtimes, and
AI Gateways. 

Today implementors populate the required fields with garbage or meaningless values. Given the unreliability of these fields hook implementors cannot rely on them to make decisions. This either leads to Hook implementations that work inconsistently across surfaces, or passing fields that are commonly ignored.

## Goals and non-goals (optional)

{State the intended outcomes and explicit boundaries. Identify what
stays unchanged, especially trust assumptions and host/provider concerns
outside the Agent Hooks contract.}

## Specification

Today the specification currently defines required & optional fields in 4.1. The table below describes whether we should keep, remove or update these fields, and the rationale why.


| Field | Continue to Support | Rationale |
| ---  | --- | --- |
| `spec`  | Keep | Identifies the context wire format version; hosts validate each context by the version it names. |
| `interception_point` | Keep | Identifies the hook interception point; necessary for remote hook execution. |
| `timestamp` | Keep | Identifies when the context was created. |
| `sequence` | Remove | May be known at the harness, but cannot be known at other execution layers. Moreover this is creating a false session, which should not be relied upon. | 
| `agent.id` | Unknown  | This represents the agent Id, however this data alone can't be trusted and needs to be verified by some other form of auth. |
| `agent.framework` | Update | This field is meant to identify the runtime invoking the hook. This may be an agent harness, gateway, or agent runtime layer |
| `agent.name` | Remove | This field doesn't make sense outside the context of an agent harness |
| `agent.version` | Update | This field is meant to identify the version of the runtime invoking the hook, this may be an agent, harness, gateway, or agent runtime layer |
| `session.id` | Remove | Unlikely to be known at other execution layers, Moreover this is creating a false session, which hook implementors cannot rely upon, since there ar eno clear semantics around session create |
| `session.started_at` | Remove | same issues as session id. | 
|`session.turn` | Remove | same issue as session id. |
| `trace.trace_id`, `trace.span_id` | Keep | support distributed tracing across execution layers is useful especially in remote. |
|`tenant.id`, `tenant.name` | Remove | this information is unreliable, as the tenant information needs to be independently verified by some form of authentication token |
|`actor.id`, `actor.kind` | Remove | unclear on how to consistently set these |
| `budgets.tool_call_count`, `budgets.token_count`, `budgets.elapsed_seconds`, `budgets.cost_usd` | keep or make extension... | This should move to an extension, having these as optional makes it difficult for hook implementors to rely on them consistently|


### Recommended normative semantics

{For contract changes, describe the recommended syntax and behavior in
enough detail for interoperable implementations. Distinguish proposed
requirements from examples and rationale. Include defaults, precedence,
validation/rejection rules, error reasons, limits, and observable results
where relevant. Identify affected spec sections and unchanged invariants.
For a non-contract question, replace this section with the proposed
procedure or design.}

{Explain interactions with interception points, verdicts, composition,
approval, identity, records, and declarations only where affected. State
which behavior belongs to the host, interceptor, resolver, or provider.}

### Schema and wire impact (when applicable)

{List changed or new schema files and closed inventories under spec/.
Show illustrative wire examples if useful, clearly labeled as proposed.
Identify constraints requiring SDK validation rather than JSON Schema.
Link authoritative schema files once they exist instead of maintaining
duplicate adopted schemas here.}

## Rationale

Explain why particular design decisions were made. This section should:

- Describe alternate designs that were considered
- Explain why the proposed approach was chosen
- Reference related work or prior art
- Document important objections or concerns raised during discussion
- Provide evidence of consensus within the community

### Options considered

#### A. Keep the current contract

{Describe the status quo and how hosts handle the gap today.}

| Advantages | Costs and risks |
| --- | --- |
| {What this preserves or avoids.} | {What remains unsolved or moves to hosts.} |

#### B. {Alternative}

{Describe a viable alternative with enough detail for a fair comparison.}

| Advantages | Costs and risks |
| --- | --- |
| {Benefit.} | {Trade-off, limitation, or failure mode.} |

<!-- Add further lettered options as needed. Present alternatives
neutrally; do not make a preferred option look inevitable. -->

### Recommendation (for discussion)

{Name the preferred option and explain why its trade-offs are preferable.
Record important objections and remaining risks, including dissent from
discussion. Separate evidence or agreement from assumptions.}

### Related decisions (optional)

{Link related proposals, issues, prior art, and relevant spec sections.
If reopening a decision, name the new evidence that changed it. If
superseding a proposal, identify what is replaced and what survives.}

## Security and privacy

{Describe changes to trust boundaries, enforcement/fail-closed behavior,
approval binding, validation, and payload-free auditing where relevant.
Include abuse cases, disclosure or retention risks, and resource bounds.
State mitigations and residual risks; if unchanged, explain why. Report
actual vulnerabilities privately per [SECURITY.md](../../SECURITY.md),
not in this proposal.}

## Backward compatibility

**Required for proposals that introduce backward incompatibilities.**

{Describe what existing hosts, interceptors, clients, and claims retain
or lose, how old/new producers and consumers interact, and any migration
or rollout path. Explicitly identify unchanged behavior. Classify the
change using [VERSIONING.md](../../VERSIONING.md), distinguishing wire,
declaration-contract, and package versions as applicable; explain the
classification.}

## Performance and operational impact (optional)

{Discuss latency, concurrency, memory, cancellation/cleanup, rollout, or
operator visibility where these affect the design. Include measurements
when available and label unmeasured assumptions.}

## SDK surface and implementation impact

{Describe the Rust core and FFI impact, and the Python, TypeScript, .NET,
and Go surfaces that must agree. Name affected APIs, adapters, bindings,
and documentation; explain unaffected surfaces. Identify feasibility
risks or implementation sequencing without treating a draft as decided.
Link existing experiments if useful; no prototype is required by this
template, and implementation follows the decision.}

## Conformance and tests

{Describe the evidence that will pin the behavior: shared CTK vectors
for cross-SDK semantics, golden/schema fixtures, or per-SDK tests as
appropriate. Cover valid cases, defaults, invalid input, failures, and
interactions with existing behavior. Explain effects on conformance
claims, capabilities, profiles, or disclosures, if any.}

| Case | Expected result |
| --- | --- |
| {Input or scenario.} | {Observable verdict, error, record, or other result.} |
