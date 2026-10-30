// Copyright (c) Microsoft. All rights reserved.

// Initial design sketch, not a normative schema or production SDK API.
// Source: spec/schema/generated/strict-contexts/agent_startup.schema.json.

import type { AgentContext } from "./agent-context.contract";

// A wire adapter derives target from agent_init.
export interface AgentStartupContext {
  context: AgentContext;
  agent_init: {
    tools_registered: string[];
  };
}
