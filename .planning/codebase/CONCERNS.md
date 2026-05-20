# Codebase Concerns

**Analysis Date:** 2026-05-20

## Tech Debt

**Firebase Integration:**
- Issue: Firebase operations tightly coupled with context
- Files: `src/context/app-context.tsx`
- Impact: Hard to test and maintain
- Fix approach: Abstract Firebase operations into a separate service layer

**Error Handling:**
- Issue: Limited error handling in components
- Files: `src/app/global-error.tsx`, `src/components/`
- Impact: Poor user experience during failures
- Fix approach: Implement more granular error boundaries

## Known Bugs

**Error Boundary:**
- Symptoms: Generic error message displayed
- Files: `src/app/global-error.tsx`
- Trigger: Any runtime error
- Workaround: None

## Security Considerations

**Environment Variables:**
- Risk: `.env` files not found, potential misconfiguration
- Files: Not detected
- Current mitigation: Use Firebase for secrets
- Recommendations: Ensure `.env` files are properly managed

## Performance Bottlenecks

**State Updates:**
- Problem: Frequent re-renders due to context updates
- Files: `src/context/app-context.tsx`
- Cause: No memoization of derived state
- Improvement path: Use `useMemo` or selectors

## Fragile Areas

**App Context:**
- Files: `src/context/app-context.tsx`
- Why fragile: High complexity, many responsibilities
- Safe modification: Refactor into smaller hooks
- Test coverage: Limited

## Scaling Limits

**Firebase Realtime Database:**
- Current capacity: Limited by Firebase free tier
- Limit: Concurrent connections, data size
- Scaling path: Upgrade Firebase plan

## Dependencies at Risk

**Radix UI:**
- Risk: Frequent updates may break components
- Impact: UI regressions
- Migration plan: Lock versions in `package.json`

## Missing Critical Features

**Testing Coverage:**
- Problem: Limited end-to-end tests
- Blocks: Confidence in deployment

## Test Coverage Gaps

**Untested area:**
- What's not tested: Firebase operations
- Files: `src/context/app-context.tsx`
- Risk: Breakage during refactor
- Priority: High

---

*Concerns audit: 2026-05-20*