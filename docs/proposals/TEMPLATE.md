# P-NNN: {Short title naming the design question or change}

**Status:** **Draft**
**Raised by:** {Name or GitHub handle, YYYY-MM-DD; originating issue,
integration need, or design review, with links where available.}

See the [proposal process](README.md) for scope, lifecycle, decision
authority, and review window.

<!--
Copy to P-NNN-<slug>.md, replacing NNN with an unused proposal number.
Keep existing proposal numbers.
Replace placeholders and remove authoring guidance before submitting.

This is an authoring aid, not a new approval checklist. The proposal
README defines scope, lifecycle, decision authority and review window.
Keep the gap, options with trade-offs, and recommendation. Adapt or
combine technical sections to fit the question; omit optional sections
that add no information. For impact sections, explain why an area is
unaffected rather than leaving an unexplained "N/A".
-->

## The gap

{Briefly state the problem, who encounters it, and why the current
contract is inadequate. Cite affected spec sections and give a concrete
failure or integration scenario. Distinguish a missing design decision
from an implementation bug. Summarize the proposed direction.}

## Goals and non-goals (optional)

{State the intended outcomes and explicit boundaries. Identify what
stays unchanged, especially trust assumptions and host/provider concerns
outside the Agent Hooks contract.}

## Related decisions (optional)

{Link related proposals, issues, prior art, and relevant spec sections.
If reopening a decision, name the new evidence that changed it. If
superseding a proposal, identify what is replaced and what survives.}

## Options

### A. Keep the current contract

{Describe the status quo and how hosts handle the gap today.}

| Advantages | Costs and risks |
| --- | --- |
| {What this preserves or avoids.} | {What remains unsolved or moves to hosts.} |

### B. {Alternative}

{Describe a viable alternative with enough detail for a fair comparison.}

| Advantages | Costs and risks |
| --- | --- |
| {Benefit.} | {Trade-off, limitation, or failure mode.} |

<!-- Add further lettered options as needed. Present alternatives
neutrally; do not make a preferred option look inevitable. -->

## Recommendation (for discussion)

{Name the preferred option and explain why its trade-offs are preferable.
Record important objections and remaining risks, including dissent from
discussion. Separate evidence or agreement from assumptions.}

## Recommended normative semantics

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

## Security and privacy

{Describe changes to trust boundaries, enforcement/fail-closed behavior,
approval binding, validation, and payload-free auditing where relevant.
Include abuse cases, disclosure or retention risks, and resource bounds.
State mitigations and residual risks; if unchanged, explain why. Report
actual vulnerabilities privately per [SECURITY.md](../../SECURITY.md),
not in this proposal.}

## Compatibility and versioning

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

## Decision needed

- [ ] {Choice among lettered options or a clearly described variant.}
- [ ] {Unresolved parameter, objection, or evidence needed for a decision.}

<!-- After a maintainer decision, add a "Decision" section recording the
date, chosen option, amendments, rationale, and deciding PR. Update Status
to Decided with the date, decision and amendments; do not invent an
Accepted/Final stage. Link implementation work as it becomes available.
If later superseded, set Status to "Superseded by P-NNN", link the
replacement and state what survives. Keep the original question,
alternatives and reasoning as the decision record. -->
