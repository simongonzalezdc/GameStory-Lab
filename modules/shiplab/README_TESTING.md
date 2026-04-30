# ShipLab Testing Guide

## Running Tests

ShipLab uses Vitest for fast, modern testing.

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test test/lib/generators/licensing.test.ts
```

## Test Structure

Tests are organized in the `test/` directory, mirroring the `src/` structure:

```
test/
├── lib/
│   ├── generators/
│   │   ├── licensing.test.ts
│   │   ├── marketing.test.ts
│   │   └── deployment.test.ts
│   └── analysis/
│       └── quality.test.ts
└── setup.ts
```

## Writing Tests

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { generateLicenseText } from '@/lib/generators/licensing';

describe('generateLicenseText', () => {
  it('should generate MIT license', () => {
    const text = generateLicenseText('mit', 'MyProject', 'John Doe', 2025);

    expect(text).toContain('MIT License');
    expect(text).toContain('Copyright (c) 2025 John Doe');
  });
});
```

### Example Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Testing Best Practices

1. **Mock external dependencies**: Use `vi.mock()` to mock AI services, file system, etc.
2. **Test behavior, not implementation**: Focus on what the code does, not how
3. **Keep tests isolated**: Each test should be independent
4. **Use descriptive test names**: Make it clear what is being tested
5. **Test edge cases**: Don't just test the happy path

## Coverage Goals

- **Unit tests**: Aim for >80% coverage on business logic
- **Integration tests**: Cover critical user flows
- **E2E tests**: Cover main user journeys (coming soon)

## CI/CD Integration

Tests run automatically on:
- Push to any branch
- Pull request creation
- Before deployment

## Debugging Tests

### Run specific test with detailed output
```bash
npm test -- --reporter=verbose licensing.test.ts
```

### Debug a failing test
```bash
npm test -- --no-coverage --reporter=verbose
```

## Common Issues

### "Module not found" errors
Make sure path aliases in `vitest.config.ts` match `tsconfig.json`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### React component tests fail
Ensure `@testing-library/react` and `@testing-library/jest-dom` are installed and setup file is configured.

### AI/LLM tests are flaky
Mock the LLM router to return predictable responses:
```typescript
vi.mock('@/lib/ai/router', () => ({
  getLLMRouter: vi.fn(() => ({
    chat: vi.fn().mockResolvedValue({ content: 'mock response' }),
  })),
}));
```

## Performance Testing

Monitor test execution time:
```bash
npm test -- --reporter=verbose --reporter=json --outputFile=test-results.json
```

Slow tests (>1s) should be optimized or moved to integration tests.

## Future Enhancements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Mutation testing
- [ ] API contract testing
