# Tools Feature

This directory is reserved for reusable tools-domain business logic.

Current tools screens still live under `app/(tabs)/tools/`, and current shared tool state lives in:

- `src/stores/todoStore.ts`
- `src/stores/habitStore.ts`

Future work can gradually move reusable calculations, selectors, workflows, and feature-specific helpers here. Do not migrate existing screens during architecture hardening phases.
