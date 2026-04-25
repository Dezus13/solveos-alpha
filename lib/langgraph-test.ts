/**
 * LangGraph Import Test
 *
 * Purpose: Verify @langchain/langgraph is installed and TypeScript can resolve
 * its types. This file is a placeholder for future multi-agent workflows
 * (AI Board, Strategist, Skeptic, Operator).
 *
 * DO NOT wire into the app yet — install verification only.
 */

import { StateGraph, END } from "@langchain/langgraph";

// Minimal smoke-test: confirm StateGraph is importable and constructible.
// This will surface any missing types or resolution errors at build/lint time.
type AgentState = {
  messages: string[];
};

const _graph = new StateGraph<AgentState>({
  channels: {
    messages: {
      reducer: (a: string[], b: string[]) => [...a, ...b],
      default: () => [],
    },
  },
});

// Unused intentionally — this file is a type-check / import sanity test only.
void _graph;
void END;

export {};
