# Schema source and generated output

This is the draft specification's schema folder. Edit `src/` here;
`npm run generate:schema` and `npm run check:schema` target this folder by
default. SDKs and the Python mirror are pinned to
[`spec/0.1.0/schema/`](../../0.1.0/schema/) for now.

The TypeScript files in `src/` are the editable schema source.
`generated/` contains the committed draft JSON Schemas. Released SDK consumers
remain pinned as described above; do not treat these artifacts as an SDK
migration. Do not edit generated JSON by hand.

- Root schemas are written to `generated/*.schema.json`.
- Per-interception-point schemas are derived from the agent-context union and
  written to `generated/strict-contexts/*.schema.json`. Despite that directory
  name, request roots are open; each variant requires its own hook payload.
- `src/host-declaration.ts` generates both supported declaration schemas.
- `path-grammar.abnf` remains a hand-maintained grammar, not generated output.

## Draft hook request and response roots

The [draft specification](../AGENT-HOOKS-0.1.md#5-verdict) pairs each request's
`interception_point` with its response root:

| Point | Response schema in `generated/` |
| --- | --- |
| `agent_startup` | [agent-startup-hook-response.schema.json](generated/agent-startup-hook-response.schema.json) |
| `input` | [input-hook-response.schema.json](generated/input-hook-response.schema.json) |
| `pre_model_call` | [pre-model-hook-response.schema.json](generated/pre-model-hook-response.schema.json) |
| `post_model_call` | [post-model-hook-response.schema.json](generated/post-model-hook-response.schema.json) |
| `pre_tool_call` | [pre-tool-hook-response.schema.json](generated/pre-tool-hook-response.schema.json) |
| `post_tool_call` | [post-tool-hook-response.schema.json](generated/post-tool-hook-response.schema.json) |
| `output` | [output-hook-response.schema.json](generated/output-hook-response.schema.json) |
| `agent_shutdown` | [agent-shutdown-hook-response.schema.json](generated/agent-shutdown-hook-response.schema.json) |

These are flat, closed response objects with optional namespaced root
`extensions`, not `{verdict, extensions}` envelopes. Six roots specialize the
whole-value replacement payload; startup and shutdown permit only allow/deny.
Request extensions use the same shared namespace type. Namespace reservations,
canonical byte caps, and other semantic rules still require checks beyond JSON
Schema.

`verdict.schema.json` is still the legacy generic path/value contract, not the
validation root for hook responses. `approval.schema.json` still embeds that
generic transform and `interception-record.schema.json` still projects a
transform path. Their hook-aware migration is unresolved; neither schema
establishes approval or record support for the new replacement payloads. The
shared request metadata also still permits `request_id` and `usage` outside
their intended model-hook scope. See the draft's explicit alignment notes in
[§4.5](../AGENT-HOOKS-0.1.md#45-optional--well-known-fields),
[§9](../AGENT-HOOKS-0.1.md#9-approval-seam), and
[§10.3](../AGENT-HOOKS-0.1.md#103-the-interception-record).

From `sdk/typescript`, `node scripts/check-schema-examples.mjs` validates the
draft example folders and includes positive/negative hook-response shape
probes. It does not validate all prose semantics or replace the pending CTK and
SDK migration described in [§13.2](../AGENT-HOOKS-0.1.md#132-ctk).

## Edit, generate and check

From the repository root:

```bash
cd sdk/typescript
npm ci
npm run generate:schema
npm run check:schema
npm run check:schema:equivalence -- --old <git-ref> --structural-diff
```

Edit the relevant file in `src/`, regenerate, and commit source and output
together. `check:schema` type-checks the source and rejects missing, changed
or unexpected generated schemas. Equivalence checks accept Git revisions
before and after this layout change, a schema output directory, or a
a `schema/` directory containing `generated/`. They compare schemas by
their stable published identities, not checkout paths.

Refresh the Python mirror as in
[`schema-drift.yml`](../../../.github/workflows/schema-drift.yml):

```bash
cp spec/0.1.0/schema/generated/*.schema.json sdk/python/python/agent_hooks/schema/
cp spec/0.1.0/schema/generated/strict-contexts/*.schema.json sdk/python/python/agent_hooks/schema/agent-context/
```

Run these copy commands from the repository root after generation.
Vendoring copies only generated JSON; the Python package keeps its existing
`schema/agent-context/` resource paths. Run the schema-lint CI checks when
changing schema shapes. See [Contributing](../../../CONTRIBUTING.md#schema-source)
for source annotations and the broader SDK test matrix.

## Filesystem paths are not public schema identities

This layout does not change validation semantics, `$id`, or public URLs.
Published schemas remain under
`https://responsibleai.github.io/agent-hooks/schema/v0.1/`, with per-point
schemas at `agent-context/<interception_point>.schema.json`.
The Pages workflow copies `generated/strict-contexts/` to that existing
`agent-context/` URL path, and publishes only generated JSON, never `src/`
or this README.

References resolve relative to `$id`, not to the renamed checkout directory.
Keep published identities and references unchanged when moving artifacts.
