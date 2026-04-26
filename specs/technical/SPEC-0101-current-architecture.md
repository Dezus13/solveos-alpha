# SPEC-0101: Current Architecture

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Orchestration**: [OpenAI API](https://openai.com/api/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/) (Ready for multi-agent workflows)

## Core Components
- **`DecisionForm`**: Captures user input and context.
- **`DecisionBlueprint`**: Displays the structured AI output.
- **`AgentEngine`**: Manages the multi-agent debate and synthesis.
- **`ShareCard`**: Generates the visual snapshot for sharing.
- **`BoardMock`**: UI component for simulating board-room style interactions.

## API Routes
- **`/api/solve`**: The primary endpoint for processing decision requests.
- **`/api/simulate`**: (Planned/In-progress) For running Monte Carlo style outcome simulations.

## Data Flow
1. User submits context via the UI.
2. The UI calls `/api/solve`.
3. The server orchestrates calls to the LLM (OpenAI) via LangGraph.
4. Agents generate their respective analyses.
5. A final synthesis is returned and rendered in the `DecisionBlueprint`.

## Development Guidelines
- Maintain strict TypeScript typing for all AI outputs.
- Use premium CSS effects (glassmorphism, subtle animations) for all new UI components.
- Ensure all API routes are idempotent and include robust error handling.
