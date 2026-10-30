// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/output.schema.json.

import type { AgentContext, JsonValue } from "./agent-context.contract";

// A wire adapter derives target from output, not content alone.
export interface OutputContext {
  context: AgentContext;
  output: {
    content: JsonValue;
  };
}
