---
name: strumet-workflow-rules
description: Rules for collaborating with the Strumet project owner
---

# Workflow Rules for Strumet

1. **Avoid Linear/Blind Execution**: Do NOT jump straight to writing or replacing code if the logic is complex or potentially breaks existing features.
2. **Consult Before Acting**: If you are not 100% sure about the business logic, how data is stored, or how a calculation should be performed, STOP and ASK the user for clarification.
3. **Propose Options**: When a refactoring or new feature has multiple possible implementation paths, present the options to the user with pros/cons before proceeding.
4. **Respect Existing Code**: Always analyze the existing data structures (e.g. Firebase schemas, sanitization rules) and existing calculation logic before duplicating or altering it.
