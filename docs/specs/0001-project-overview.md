# SolveOS - Project Overview

## 1. Purpose

- Define the main SolveOS system.
- Show how the product connects decisions, actions, and follow-through.

## 2. Where it is used

- Home page: user starts a decision.
- Decision console: user enters the situation.
- Result view: system shows verdict and action.
- Action banner: system keeps the next action visible.

## 3. Main objects

- Decision: user situation that needs a clear verdict.
- Verdict: short system answer for what to do.
- Action: required next step after the verdict.
- UserState: behavior record used for identity and pressure.
- DecisionHistory: saved record of past decisions.

## 4. Logic (step-by-step)

1. User enters a situation.
2. System checks the input.
3. System generates a verdict.
4. System creates a next action.
5. System saves the decision.
6. System tracks the action.
7. System updates identity based on behavior.

## 5. How all parts connect

This system is built from simple connected parts.

- The user starts with a situation -> (User Flow)
- The system analyzes it -> (Decision Engine)
- The system gives a clear verdict
- The system creates a required action -> (Action System)
- The system adds pressure -> (Identity & Pressure)
- The system tracks everything -> (Data & Storage)
- The interface shows the result -> (UI Structure)

All parts work together to push the user forward.

## 6. Why this structure is important

Each part has one clear role.

- No part does everything
- No confusion between logic
- Easy to improve each part

This makes the system simple and scalable.

## 7. System principle

SolveOS is not a chatbot.

It is a system that:

- makes decisions
- forces action
- tracks behavior
- builds momentum

The goal is not thinking - the goal is action.
