# SPEC-0011: Global Language Architecture

## Overview
SolveOS is a **Global-First** decision operating system. Our architecture ensures that high-stakes strategic analysis is available in any language, respecting cultural nuances and local linguistic requirements.

## Objectives
- **Complete i18n Coverage**: Every UI element must be translatable via keys.
- **Bi-Directional Support**: Full support for LTR (Left-to-Right) and RTL (Right-to-Left) layouts.
- **Dynamic Language Detection**: The system must automatically adapt to the user's input language.
- **Native AI Output**: Agents must think and respond in the user's chosen language without internal translation artifacts.

## Architecture Foundation

### 1. Translation System
- **Keys over Strings**: Hardcoded strings are strictly forbidden in components.
- **Locale Files**: Structured JSON files stored in `/locales/{locale}/common.json`.
- **Supported Launch Languages**: English (en), Russian (ru), German (de), Spanish (es), Arabic (ar), Chinese (zh).

### 2. Language Detection Logic
- **UI Locale**: Detected via browser `navigator.language` or user profile settings.
- **Input Locale**: The Decision Engine uses a lightweight "Language Detection" step before agent orchestration to ensure all agents use the correct linguistic context.
- **Session Persistence**: Once a language is identified for a decision thread, it is locked for that thread's history.

### 3. Layout & RTL Support
- **CSS Logical Properties**: Use `start`/`end` instead of `left`/`right` for margins, padding, and positioning.
- **Direction Attribute**: The root `<html>` tag will dynamically toggle `dir="ltr"` or `dir="rtl"` based on the active locale.
- **Font Strategy**: Use localized font stacks (e.g., 'Inter' for Latin, 'IBM Plex Sans Arabic' for Arabic).

### 4. Product Header Switcher
- A premium, minimal language selector in the global navigation to allow manual overrides.
- Icons: Use circular flags or ISO codes (EN, RU, DE, etc.).

## Implementation Roadmap
1. **Scaffolding**: Create locale directories and base translation keys.
2. **Refactoring**: Replace hardcoded UI strings with i18n hooks.
3. **Engine Update**: Inject language-specific instructions into agent prompts.
4. **Layout Check**: Audit all components for RTL compatibility.

## Success Metrics
- 100% of UI strings localized in 6 launch languages.
- Correct RTL rendering for Arabic/Hebrew locales.
- AI response language matching user input language with 100% reliability.
