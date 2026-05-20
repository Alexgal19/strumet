# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- Vitest 1.x
- Config: `vitest.config.ts`

**Assertion Library:**
- Built-in Vitest assertions

**Run Commands:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage
```

## Test File Organization

**Location:**
- Pattern: Co-located with source files

**Naming:**
- Pattern: `*.test.tsx`

**Structure:**
```
src/
├── __tests__/        # Unit tests
├── e2e/              # End-to-end tests
```

## Test Structure

**Suite Organization:**
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

**Patterns:**
- Setup: `beforeEach` for shared setup
- Teardown: `afterEach` for cleanup
- Assertions: `expect` for validation

## Mocking

**Framework:** Vitest built-in mocking

**Patterns:**
```typescript
vi.mock('module-name', () => ({
  default: vi.fn(),
}));
```

**What to Mock:**
- Firebase operations

**What NOT to Mock:**
- UI components

## Fixtures and Factories

**Test Data:**
```typescript
const mockData = {
  id: '123',
  name: 'Test',
};
```

**Location:**
- Inline within test files

## Coverage

**Requirements:** 80% target

**View Coverage:**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual components

**Integration Tests:**
- Scope: Firebase operations

**E2E Tests:**
- Framework: Playwright

## Common Patterns

**Async Testing:**
```typescript
await expect(fetchData()).resolves.toEqual(mockData);
```

**Error Testing:**
```typescript
expect(() => someFunction()).toThrow('Error message');
```

---

*Testing analysis: 2026-05-20*