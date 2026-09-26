# Project Rules & Verification Guidelines

## Post-Change Verification Requirements

Following any code changes to this project, the agent must verify that all quality checks pass before completing a task:

1. **Tests Must Pass**
   - Run: `npm run test`
   - All unit, integration, and Nuxt component/store test suites must pass.

2. **ESLint Must Pass**
   - Run: `npm run lint`
   - All linting checks must pass cleanly with zero errors.

3. **Type Checks Must Pass**
   - Run: `npm run typecheck`
   - TypeScript compilation and type checks (`nuxt typecheck`) must pass with zero diagnostics or errors.
