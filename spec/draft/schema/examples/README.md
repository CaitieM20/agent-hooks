# JSON examples

Each JSON file is a standalone instance of the named type, following MCP's
[type-directory layout](https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/schema/2026-07-28/examples).
These examples illustrate the current draft definitions only.

The scenario is a document-policy assistant searching for a retention policy.
The eight contexts form one session: a requested internal-collection search is
limited to the public collection before the tool executes. Verdicts and approval
resolutions illustrate **alternatives**, not steps that must all run. The
declarations use identity-unbound mode, so approval requests, resolutions, and
records consistently carry null identities. `operator` and
`example.document_policy` are illustrative host-registered resolver and kind
names, not built-in implementations.

## Schema mapping

All schema paths below are relative to [`../generated/`](../generated/).
Every `AgentContext` file validates against both `agent-context.schema.json`
and the indicated closed per-hook schema.

| Example file(s) | Validation schema or fragment |
| --- | --- |
| [AgentContext/agent-startup.json](AgentContext/agent-startup.json) | `strict-contexts/agent_startup.schema.json` |
| [AgentContext/input.json](AgentContext/input.json) | `strict-contexts/input.schema.json` |
| [AgentContext/pre-model-call.json](AgentContext/pre-model-call.json) | `strict-contexts/pre_model_call.schema.json` |
| [AgentContext/post-model-call.json](AgentContext/post-model-call.json) | `strict-contexts/post_model_call.schema.json` |
| [AgentContext/pre-tool-call.json](AgentContext/pre-tool-call.json) | `strict-contexts/pre_tool_call.schema.json` |
| [AgentContext/post-tool-call.json](AgentContext/post-tool-call.json) | `strict-contexts/post_tool_call.schema.json` |
| [AgentContext/output.json](AgentContext/output.json) | `strict-contexts/output.schema.json` |
| [AgentContext/agent-shutdown.json](AgentContext/agent-shutdown.json) | `strict-contexts/agent_shutdown.schema.json` |
| [Verdict/*.json](Verdict/) | `verdict.schema.json` |
| [InterceptorResponse/*-envelope.json](InterceptorResponse/) | `interceptor-response.schema.json` |
| [ApprovalRequest/collection-access.json](ApprovalRequest/collection-access.json) | `approval.schema.json#/$defs/request` |
| [ApprovalResolution/*.json](ApprovalResolution/) | `approval.schema.json#/$defs/resolution` |
| [HostDeclaration10/document-policy.json](HostDeclaration10/document-policy.json) | `host-declaration-1.0.schema.json` |
| [HostDeclaration11/document-policy.json](HostDeclaration11/document-policy.json) | `host-declaration-1.1.schema.json` |
| [InterceptionRecord/*.json](InterceptionRecord/) | `interception-record.schema.json` |
| [InterceptionPoint/pre-tool-call.json](InterceptionPoint/pre-tool-call.json) | `interception-point.schema.json` |

`Verdict/` contains bare decisions: allow, allow with a warning and result label,
deny, liftable deny, and six transforms. `InterceptorResponse/` shows the separate
envelope form with namespaced transport receipts for all three decisions. A bare
Verdict is also a valid InterceptorResponse; an envelope is not a bare Verdict.
Approval resolutions cover approve-with-allow, approve-with-transform, reject,
and unresolved; each echoes the request's `context_identity`.

The transforms map to these contexts and writable target slices:

| Verdict file | Context | Path |
| --- | --- | --- |
| `transform-input.json` | `input` | `$target.content` |
| `transform-messages.json` | `pre_model_call` | `$target[0].content` |
| `transform-response.json` | `post_model_call` | `$target.tool_calls[0].args.collection` |
| `transform-tool-args.json` | `pre_tool_call` | `$target.collection` |
| `transform-tool-result.json` | `post_tool_call` | `$target.text` |
| `transform-output.json` | `output` | `$target.content` |

Each context's `target` equals its required hook payload slice, per
[sections 3 and 4.3](../../AGENT-HOOKS-0.1.md#3-interception-points).
No transform is shown for startup or shutdown, where transforms are forbidden.
The approval transform and transform envelope also apply to `pre_tool_call`.
Records are payload-free projections: `transform.value` is deliberately absent.
These schema examples do not replace runtime validation of host registrations,
declaration consistency, transform application, or other cross-field semantics.

## Validate locally

Run the following Python from the repository root in an environment with the
repository's existing Python development dependencies (`jsonschema` and
`referencing`). It validates every JSON instance, including approval fragments,
against only the draft schemas. References are registered under their
published `$id` values, including the per-hook `agent-context/` identities;
validation does not fetch schemas or mix in released definitions.

```python
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

root = Path("spec") / "draft" / "schema"
schemas = [json.loads(p.read_text()) for p in (root / "generated").rglob("*.json")]
registry = Registry().with_resources(
    (s["$id"], Resource.from_contents(s)) for s in schemas
)
base = "https://responsibleai.github.io/agent-hooks/schema/v0.1/"
mapping = {
    "AgentContext": "agent-context.schema.json",
    "Verdict": "verdict.schema.json",
    "InterceptorResponse": "interceptor-response.schema.json",
    "ApprovalRequest": "approval.schema.json#/$defs/request",
    "ApprovalResolution": "approval.schema.json#/$defs/resolution",
    "HostDeclaration10": "host-declaration-1.0.schema.json",
    "HostDeclaration11": "host-declaration-1.1.schema.json",
    "InterceptionRecord": "interception-record.schema.json",
    "InterceptionPoint": "interception-point.schema.json",
}
files = sorted((root / "examples").rglob("*.json"))
assert files, "No examples found"
for path in files:
    instance = json.loads(path.read_text())
    refs = [mapping[path.parent.name]]
    if path.parent.name == "AgentContext":
        refs.append(f"agent-context/{instance['interception_point']}.schema.json")
    if path.parent.name == "Verdict":
        refs.append("interceptor-response.schema.json")
    for ref in refs:
        Draft202012Validator(
            {"$ref": base + ref}, registry=registry, format_checker=FormatChecker()
        ).validate(instance)
print(f"Validated {len(files)} JSON examples")
```
