# Functional Map

## Product goal

This map explains the main parts of SolveOS in simple terms so a reviewer can understand how the product works from input to final decision.

## Core features

- Input Layer: user text, files, images, voice, and language detection.
- Context and Memory Layer: stores decision threads, snapshots, and lessons.
- Decision Logic Layer: AI advisors debate and synthesize a recommendation.
- UI Layer: chat workspace, advisor dashboard, blueprint viewer, and history.
- Output Layer: shareable snapshots and future PDF or Markdown exports.

## User flow

1. Intake: user enters a decision and any supporting context.
2. Contextualize: system identifies language and retrieves relevant memories.
3. Simulate: advisors analyze upside, risk, and execution.
4. Synthesize: system creates a Decision Blueprint.
5. Iterate: user asks follow-up questions or adds new information.

## Technical overview

The app can be organized as a front-end workspace calling server routes for AI analysis. The AI route receives decision context, sends it through advisor logic, and returns structured output for the blueprint UI.

## Roadmap / order of work

1. Finish text-based intake.
2. Build reliable blueprint output.
3. Add advisor roles and debate flow.
4. Add memory retrieval.
5. Add sharing and export features.
