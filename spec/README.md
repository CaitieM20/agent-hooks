# Agent Hooks specification versions

Released specifications live in semantic-version folders named
`MAJOR.MINOR.PATCH`. Ongoing work lives in [`draft/`](draft/).

| Version | Status | Wire version | Specification | Schemas |
| --- | --- | --- | --- | --- |
| [0.1.0](0.1.0/) | Latest release | `agent-hooks/0.1` | [AGENT-HOOKS-0.1.md](0.1.0/AGENT-HOOKS-0.1.md) | [schema/](0.1.0/schema/) |
| [draft](draft/) | In progress | `agent-hooks/0.1` | [AGENT-HOOKS-0.1.md](draft/AGENT-HOOKS-0.1.md) | [schema/](draft/schema/) |

Each folder is a complete specification bundle:

- `AGENT-HOOKS-<wire-major>.<wire-minor>.md`: the normative text
- `DECLARATION-VERSIONS.md`: host declaration contract versions
- `declaration-errors.json`, `reserved-reasons.json`,
  `reserved-warnings.json`: machine-readable inventories
- `schema/`: JSON Schemas and the path grammar

## Working on the specification

Make normative changes in `draft/`. SDKs, conformance tooling, and
generated schemas on `main` track `draft/`.

Released folders are immutable records of a release. Do not change their
normative content; make the change in `draft/` and release a new version.

The folder version is the specification release version. It is separate
from the wire version (`agent-hooks/X.Y`), the host declaration contract
version, and SDK package versions (see [VERSIONING.md](../VERSIONING.md)).

To publish a new version, follow
[`.github/skills/add-spec-version/SKILL.md`](../.github/skills/add-spec-version/SKILL.md).
