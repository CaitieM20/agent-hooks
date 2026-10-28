---
name: add-spec-version
description: Publish a new Agent Hooks specification version by snapshotting spec/draft into spec/MAJOR.MINOR.PATCH and updating indexes, site publishing, and references. Use when releasing or adding a specification version.
---

# Add an Agent Hooks specification version

Use this procedure when the current `spec/draft/` content becomes a
released specification version.

## Rules

- Name released folders `spec/<MAJOR>.<MINOR>.<PATCH>/`, for example
  `spec/0.2.0/`. Do not add pre-release suffixes such as `-beta.1`.
- The folder version is the specification release version. Do not
  confuse it with the wire version (`agent-hooks/X.Y`), the host
  declaration contract version, or SDK package versions.
- Never edit an existing released folder. CI fails pull requests that
  change a version folder already present on the base branch. Make
  changes in `spec/draft/`, then publish a new version.
- SDK development is currently pinned to `spec/0.1.0/`. Do not retarget
  SDK code, tests, vendored schemas, conformance-vector validation, or
  version checks as part of adding a spec version until the project
  decides how SDKs track specification versions.

## Steps

1. Choose the new version and confirm `spec/<version>/` does not exist.
   Use [VERSIONING.md](../../../VERSIONING.md) to decide whether the
   specification change is a major, minor, or patch release.

2. Make sure the draft is ready to release:

   ```bash
   python3 scripts/gen-per-point-schemas.py
   python3 scripts/check-version-consistency.py
   python3 scripts/check-spec-versions.py
   ```

   Update `spec/draft/DECLARATION-VERSIONS.md` if the release changes
   accepted declaration versions.

3. Copy the complete bundle:

   ```bash
   cp -R spec/draft spec/<version>
   ```

4. Edit `spec/<version>/AGENT-HOOKS-*.md`:
   - Remove the draft notice at the top.
   - Make sure the status, version, and date lines describe the release.
   - Replace every `spec/draft/` reference with `spec/<version>/`.

   Also replace `spec/draft/` with `spec/<version>/` in
   `spec/<version>/DECLARATION-VERSIONS.md`.

5. Keep working on the draft. In `spec/draft/AGENT-HOOKS-*.md`, update
   the draft notice to link to `../<version>/AGENT-HOOKS-*.md` as the
   latest released specification.

6. Update [spec/README.md](../../../spec/README.md):
   - Add a row linking `spec/<version>/`, its specification, and schemas.
   - Mark only the new version as `Latest release`; mark older versions
     `Released`.
   - Keep the `draft` row.

7. Update the documentation site in
   [.github/workflows/pages.yml](../../workflows/pages.yml):
   - Set `SPEC_VERSION` to `<version>`.
   - Set `SPEC_FILE` if the spec filename changed.
   - Set `SCHEMA_PATH` to the path used by the released schemas'
     `$id` values (for example `v0.1` for
     `https://responsibleai.github.io/agent-hooks/schema/v0.1/...`).

   Update the Specification navigation label in
   [docs-site/mkdocs.yml](../../../docs-site/mkdocs.yml) to `<version>`.

8. Update links that point readers to the latest released spec, such as
   `README.md`, `SECURITY.md`, `docs/`, `conformance/CLAIMS.md`, SDK
   READMEs, and `sdk/python/pyproject.toml`. Leave SDK implementation
   references and SDK tooling at their pinned version.

   Find candidates with:

   ```bash
   git grep -n 'spec/[0-9][0-9.]*/'
   ```

   Historical changelog entries and proposals can keep the paths that
   were accurate when they were written.

9. Validate:

   ```bash
   python3 scripts/check-spec-versions.py
   python3 scripts/check-version-consistency.py
   python3 scripts/gen-per-point-schemas.py
   git diff --exit-code -- spec/draft/schema/agent-context
   ```

   Also run the schema-lint, drift, and pages jobs in CI. Run any SDK
   tests affected by changed references.

10. Add a `CHANGELOG.md` entry naming the new specification version, then
    follow [RELEASING.md](../../../RELEASING.md) for any package release.
