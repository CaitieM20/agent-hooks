// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/post_tool_call.schema.json.

import type { AgentContext, JsonObject, JsonValue } from "./agent-context.contract";

// A wire adapter derives target from tool_result.value, not the result wrapper.
export interface PostToolCallContext {
  context: AgentContext;
  tool_call: {
    /** @minLength 1 */
    id: string;
    /** @minLength 1 */
    name: string;
    args: JsonObject;
  };
  tool_result: {
    value: JsonValue;
    is_error: boolean;
  };
}
