# SPEC-0009: Decision War Room User Flow

## Overview
This document maps the primary user journey from initiating a high-stakes decision to receiving a synthesized recommendation from the AI War Room.

## The "CTO Hire" Scenario
*Example Decision: "Should we hire a full-time CTO or continue with a fractional consultant?"*

### Phase 1: Briefing (The Input)
1. **User Input**: User types the decision context in the Chat Workspace.
2. **Clarification Loop**: The system identifies missing variables and asks:
   - "What is your current runway?"
   - "How technical is the founding team?"
   - "What is the primary technical challenge in the next 6 months?"
3. **Commitment**: User provides answers and clicks "Enter War Room."

### Phase 2: Deliberation (The Debate)
1. **Strategist Opening**: "A full-time CTO is essential for long-term IP equity and technical vision. The upside is a 3x faster development cycle."
2. **Skeptic Challenge**: "We only have 10 months of runway. A full-time CTO hire will cost €150k+ in equity and salary, shortening our runway to 6 months. It's a high-risk move."
3. **Operator Reality Check**: "Hiring a CTO takes 3-4 months. We need to ship the beta in 6 weeks. A fractional consultant can scale up immediately, while the search for a CTO runs in the background."
4. **Agent Debate**: The Strategist and Skeptic clash over "Risk vs. Vision," while the Operator mediates based on "Timelines."

### Phase 3: Synthesis (The Verdict)
1. **Consensus Formation**: The agents align on a hybrid recommendation.
2. **The Blueprint**: The system generates the final report:
   - **The Verdict**: "Hybrid Path: Extend the fractional consultant for 3 months while initiating a targeted search for a CTO."
   - **Confidence Score**: 85%
   - **Risk Meter**: Medium (Managed)
   - **Action Items**: Draft CTO job description; Renegotiate consultant contract for 3-month extension.

### Phase 4: Follow-up (Interaction)
1. **User Question**: "What if the consultant refuses the extension?"
2. **Instant Pivot**: The Operator agent recalculates the execution plan based on this new constraint.

## User Experience Principles
- **Transparency**: User sees the agents "typing" and "thinking" to build trust.
- **Agency**: User can interrupt the debate or side with a specific agent to steer the analysis.
- **Clarity**: The transition from messy debate to clean Blueprint must feel like "cutting through the noise."
