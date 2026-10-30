// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/input.schema.json.

import type { AgentContext, JsonValue } from "./agent-context.contract";

// A wire adapter derives target from input, not content alone.
export interface InputContext {
  context: AgentContext;
  input: {
    content: JsonValue;
    role: "user" | "system" | "external";
  };
}
