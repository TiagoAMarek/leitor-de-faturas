# Agent Development Guide

This guide provides essential information for AI coding agents working on the **leitor-de-faturas** project.

## Project Overview

A Next.js application for parsing and visualizing credit card statements (faturas) from PDF and OFX files. The app supports Itaú bank statements and generic OFX format files, extracting transactions and categorizing them automatically.

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript 5, pdf-parse, CSS Modules

## Build & Development Commands

```bash
# Development server (default port 3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

**Note:** This project uses `pnpm` as the package manager.

## Testing

Currently, no test framework is configured. When adding tests:
- Suggested framework: Jest + React Testing Library
- Place tests in `__tests__` directories or name them `*.test.ts` / `*.spec.ts`
- Run single test: `jest path/to/test.test.ts` (once configured)

## Code Style Guidelines

### TypeScript Configuration

- **Strict mode enabled** (`strict: true`)
- Target: ES2017
- Module resolution: bundler
- Always use explicit types for function parameters and return values
- Avoid `any` - use proper typing or `unknown` with type guards

### Import Conventions

```typescript
// External packages first
import { useState } from 'react';
import { NextResponse } from 'next/server';

// Internal imports using @ alias
import { parseStatement } from '@/lib/parser';
import type { ParsedStatement } from '@/lib/parser';
import styles from './Component.module.css';
```

**Path Alias:** Use `@/*` for `./src/*` imports

### File Organization

```
src/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/       # React components
└── lib/             # Utility functions and parsers
```

### Component Structure

**Client Components:**
```typescript
'use client';

import { useState } from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  onAction: (data: string) => void;
  isLoading: boolean;
}

export default function Component({ onAction, isLoading }: ComponentProps) {
  const [state, setState] = useState<string>('');
  // ... implementation
}
```

**Server Components/API Routes:**
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // ... implementation
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error description:', error);
    return NextResponse.json(
      { error: 'User-friendly error message' },
      { status: 500 }
    );
  }
}
```

### Naming Conventions

- **Files:** PascalCase for components (`UploadZone.tsx`), camelCase for utilities (`parser.ts`)
- **Components:** PascalCase with default exports (`export default function UploadZone`)
- **Interfaces:** PascalCase with descriptive names (`ParsedStatement`, `UploadZoneProps`)
- **Functions:** camelCase (`parseStatement`, `handleFileSelected`)
- **Constants:** SCREAMING_SNAKE_CASE for static config (`CATEGORY_ICONS`)
- **CSS Modules:** camelCase (`styles.container`, `styles.errorCard`)

### Type Definitions

Always define interfaces for:
- Component props
- API response/request bodies
- Complex data structures

```typescript
export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  city: string;
  installment?: string;
}
```

### Error Handling

**API Routes:**
```typescript
try {
  // ... operation
} catch (error) {
  console.error('Descriptive context:', error);
  return NextResponse.json(
    { error: 'Portuguese user-friendly message' },
    { status: 400 | 422 | 500 }
  );
}
```

**Client Components:**
```typescript
try {
  const res = await fetch('/api/endpoint', { method: 'POST', body: formData });
  const data = await res.json();
  
  if (!res.ok) {
    setError(data.error || 'Mensagem padrão');
    return;
  }
  
  // ... handle success
} catch {
  setError('Erro de conexão. Tente novamente.');
} finally {
  setIsLoading(false);
}
```

### Styling

- Use **CSS Modules** for component styling
- File naming: `Component.module.css`
- Class naming: camelCase (`.errorCard`, `.dragOver`)
- No inline styles except for dynamic values

### Code Quality

- **No unused imports or variables**
- **Explicit return types** for non-trivial functions
- **Descriptive variable names** (avoid abbreviations)
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive computations
- Always handle loading states and errors in UI
- Validate user input before processing

### Comments

- Add JSDoc comments for exported functions with complex logic
- Inline comments for non-obvious regex patterns or business rules
- Example from codebase:

```typescript
/**
 * Generic parser entry point.
 * Detects bank from text content and delegates to the appropriate parser.
 */
export function parseStatement(text: string): ParsedStatement {
  // ... implementation
}
```

## Project-Specific Guidelines

### Parser Development

When adding support for new banks:
1. Create a new parser function (e.g., `parseNubankStatement`)
2. Add detection logic to `parseStatement`
3. Follow existing pattern: extract metadata first, then transactions
4. Use regex for pattern matching: `/pattern/i.test(text)`
5. Always return `ParsedStatement` interface

### Category Detection

- Keep category keywords in Portuguese
- Update `CATEGORY_ICONS` and `CATEGORY_COLORS` for new categories
- Use case-insensitive regex: `/keyword/i.test(description)`

### API Configuration

- Mark external packages in `next.config.ts` if needed (e.g., `pdf-parse`)
- API routes go in `src/app/api/[route]/route.ts`

## Common Pitfalls

1. **Forgetting `'use client'`** directive for components using hooks
2. **Not handling async errors** in API routes
3. **Mixing server/client components** without understanding boundaries
4. **Ignoring TypeScript errors** - always fix them, don't use `@ts-ignore`
5. **Not validating file types** before processing

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
