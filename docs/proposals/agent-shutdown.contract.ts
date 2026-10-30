// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/agent_shutdown.schema.json.

import type { AgentContext } from "./agent-context.contract";

// A wire adapter derives target from summary.
export interface AgentShutdownContext {
  context: AgentContext;
  summary: {
    reason: "completed" | "error" | "cancelled";
  };
}
