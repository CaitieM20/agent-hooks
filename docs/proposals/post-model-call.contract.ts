// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/post_model_call.schema.json.

import type { AgentContext, JsonObject, JsonValue } from "./agent-context.contract";

// A wire adapter derives target from the entire response.
export interface PostModelCallContext {
  context: AgentContext;
  model: {
    id: string;
  };
  response: {
    content: JsonValue;
    // Required even when empty; the schema's optional tool-call id is omitted.
    tool_calls: {
      name: string;
      args: JsonObject;
    }[];
    finish_reason: string;
  };
}
