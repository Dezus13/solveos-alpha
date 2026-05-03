# SolveOS - Project Overview

## 1. Purpose

- Define the main SolveOS system.
- Show how the product connects Decisions, Actions, and follow-through.

## 2. Where it is used

- Home page: user starts a Decision.
- Decision console: user enters the Decision.
- Result view: system shows Verdict and Action.
- Action banner: system keeps the Action visible.

## 3. Main objects

- Decision: user situation that needs a clear Verdict.
- Verdict: short system answer for what to do.
- Action: required next step after the Verdict.
- UserState: behavior record used by the Identity Engine and Pressure Layer.
- Decision Journal: saved list of past Decisions.

## 4. Logic (step-by-step)

1. User enters a Decision.
2. System checks the input.
3. System generates a Verdict.
4. System creates an Action.
5. System saves the Decision.
6. System tracks the Action.
7. System updates UserState.

## 5. How all parts connect

This system is built from simple connected parts.

- The user starts with a Decision -> (User Flow)
- The system analyzes it -> (Decision Engine)
- The system gives a clear Verdict
- The system creates a required Action -> (Action System)
- The Identity Engine reads UserState -> (Identity Engine And Pressure Layer)
- The Pressure Layer reacts to delay or skip -> (Identity Engine And Pressure Layer)
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

- makes Decisions
- forces Action
- tracks behavior
- builds momentum

The goal is not thinking - the goal is Action.
