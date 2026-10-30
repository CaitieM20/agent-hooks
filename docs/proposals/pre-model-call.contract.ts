// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/pre_model_call.schema.json.

import type { AgentContext, JsonValue } from "./agent-context.contract";

// A wire adapter derives target from messages, not model.
export interface PreModelCallContext {
  context: AgentContext;
  model: {
    id: string;
  };
  messages: {
    role: string;
    content: JsonValue;
  }[];
}
