# Product Functional Map: Conversational Decision Workspace

This map outlines the functional architecture required to deliver the Conversational Decision Workspace.

## 1. Input Layer (The Intake)
- **Natural Language Processor**: Parses user intent from chat.
- **File Ingestion Engine**: Handles PDF, DOCX, and CSV parsing.
- **Vision Module**: Analyzes uploaded images/screenshots.
- **Voice Transcription**: Converts speech to text in real-time.
- **Language Detector**: Identifies and sets the session locale.

## 2. Context & Memory Layer (The Knowledge)
- **Vector Database**: Stores decision embeddings for RAG (Retrieval-Augmented Generation).
- **Thread Manager**: Maintains state across long-running decision dialogues.
- **Historical Reference Engine**: Surfaces similar past decisions.
- **Post-Mortem Logger**: Records outcomes and lessons learned.

## 3. Decision Logic Layer (The War Room)
- **Agent Orchestrator (LangGraph)**: Manages the multi-agent state machine.
- **Persona Engine**: Configures Strategist, Skeptic, and Operator behaviors.
- **Debate Moderator**: Synthesis of agent outputs into a unified verdict.
- **Synthesis Engine**: Generates the final Decision Blueprint (Risk, Confidence, Action).

## 4. UI/UX Layer (The Workspace)
- **Chat Interface**: Core interaction area with message history.
- **Advisors Dashboard**: Visual representation of active AI agents.
- **File/Asset Gallery**: Shows all documents/images attached to the current decision.
- **Blueprint Viewer**: Dedicated view for the final structured report.
- **History Sidebar**: Navigation between different decision threads.

## 5. Integration & Output Layer (The Result)
- **Sharing Engine**: Generates shareable snapshots and URLs.
- **Export Module**: Downloads blueprints as PDF or Markdown.
- **External API (Future)**: Allows third-party tools to trigger decisions.

## Functional Flow
1. **Intake**: User speaks/types/uploads a decision context.
2. **Contextualize**: System identifies language and retrieves relevant memories.
3. **Simulate**: War Room agents debate the context.
4. **Synthesize**: Moderator produces a structured blueprint.
5. **Iterate**: User asks follow-up questions or adds more data to the thread.
