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

Testing uses **Vitest 4**, **React Testing Library**, and **happy-dom** as the DOM environment.

```bash
# Run all tests in watch mode
pnpm test

# Single run (CI)
pnpm test:run

# E2E upload flow tests
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Vitest UI
pnpm test:ui
```

- Place unit tests in `test/` or colocated as `*.test.ts` / `*.spec.ts`
- E2E tests go in `test/e2e/`
- Test helpers and mock factories live in `test/helpers/`
- Fixture files (sample PDFs/OFX) go in `test/fixtures/`

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
import { useState } from "react";
import { NextResponse } from "next/server";

// Internal imports using @ alias
import { parseStatement } from "@/lib/parser";
import type { ParsedStatement } from "@/lib/parser";
import styles from "./Component.module.css";
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
    ├── constants.ts    # Centralized constants (no magic numbers/strings)
    ├── validators.ts   # File validation utilities
    ├── file-utils.ts   # File download utilities
    ├── parser.ts       # Main parser entry point
    ├── parsers/        # Bank-specific parsers
    ├── categories.ts   # Transaction categorization
    └── utils.ts        # General utilities
```

### Component Structure

**Client Components:**

```typescript
"use client";

import { useState } from "react";
import styles from "./Component.module.css";

interface ComponentProps {
  onAction: (data: string) => void;
  isLoading: boolean;
}

export default function Component({ onAction, isLoading }: ComponentProps) {
  const [state, setState] = useState<string>("");
  // ... implementation
}
```

**Server Components/API Routes:**

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // ... implementation
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error description:", error);
    return NextResponse.json(
      { error: "User-friendly error message" },
      { status: 500 },
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
  console.error("Descriptive context:", error);
  return NextResponse.json(
    { error: "Portuguese user-friendly message" },
    { status: 400 | 422 | 500 },
  );
}
```

**Client Components:**

```typescript
try {
  const res = await fetch("/api/endpoint", { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok) {
    setError(data.error || "Mensagem padrão");
    return;
  }

  // ... handle success
} catch {
  setError("Erro de conexão. Tente novamente.");
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

**DRY Principles:**

- **Use centralized constants** from `src/lib/constants.ts` - no magic numbers or strings
- **Use validators** from `src/lib/validators.ts` - avoid inline validation logic
- **Use file utilities** from `src/lib/file-utils.ts` - avoid duplicate download code
- Extract reusable logic into utility functions

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

### Utility Modules

#### Constants (`src/lib/constants.ts`)

All magic numbers and strings are centralized in this file. **Never hardcode values** - always use constants.

**File Validation:**
```typescript
import { MAX_FILE_SIZE, ERROR_MESSAGES } from '@/lib/constants';

// Use constants instead of hardcoding
if (file.size > MAX_FILE_SIZE) {
  alert(ERROR_MESSAGES.FILE_TOO_LARGE);
}
```

**Parser Constants:**
```typescript
import { OFX_IGNORED_MEMOS, ITAU_LABELS } from '@/lib/constants';

// Use predefined patterns
if (OFX_IGNORED_MEMOS.some(memo => description.includes(memo))) {
  continue;
}
```

**Available Constant Groups:**
- `MAX_FILE_SIZE`, `SUPPORTED_FILE_EXTENSIONS`, `SUPPORTED_MIME_TYPES`
- `ERROR_MESSAGES` - All user-facing error messages in Portuguese
- `OFX_IGNORED_MEMOS`, `OFX_DATE_INDICES` - OFX parser constants
- `ITAU_LABELS`, `ITAU_PATTERNS`, `ITAU_TRANSACTION_START_MARKERS` - Itaú parser constants
- `BANK_DETECTION` - Bank detection markers
- `UI_CONSTANTS` - Animation delays, default filenames

#### Validators (`src/lib/validators.ts`)

Use these validation functions instead of inline logic to maintain consistency.

```typescript
import { isFileSizeValid, isPdfFile, isOfxFile, isFileTypeSupported } from '@/lib/validators';

// Instead of: file.size > MAX_FILE_SIZE
if (!isFileSizeValid(file)) {
  // Handle error
}

// Instead of: file.name.endsWith('.pdf')
if (isPdfFile(file)) {
  // Process PDF
}

// Check any supported type
if (!isFileTypeSupported(file)) {
  return NextResponse.json({ error: ERROR_MESSAGES.INVALID_FILE_FORMAT });
}
```

**Available Validators:**
- `isFileSizeValid(file: File): boolean` - Check file size limits
- `isPdfFile(file: File): boolean` - Check if file is PDF
- `isOfxFile(file: File): boolean` - Check if file is OFX
- `isFileTypeSupported(file: File): boolean` - Check if file type is supported

#### File Utilities (`src/lib/file-utils.ts`)

Use these utilities to avoid duplicating file download logic.

```typescript
import { downloadBlob, downloadTextFile } from '@/lib/file-utils';

// Download text content (e.g., OFX export)
const content = generateOfx(statement);
downloadTextFile(content, 'fatura.ofx', 'application/x-ofx');

// Download binary blob
const blob = new Blob([data], { type: 'application/pdf' });
downloadBlob(blob, 'document.pdf');
```

**Available Functions:**
- `downloadBlob(blob: Blob, filename: string): void` - Download any blob
- `downloadTextFile(content: string, filename: string, mimeType?: string): void` - Download text content

### Parser Development

When adding support for new banks:

1. Create a new parser function (e.g., `parseNubankStatement`)
2. Add detection logic to `parseStatement`
3. Follow existing pattern: extract metadata first, then transactions
4. Use regex for pattern matching: `/pattern/i.test(text)`
5. Always return `ParsedStatement` interface
6. **Add parser-specific constants to `constants.ts`**
7. **Use marker arrays with `.some()` for multiple pattern checks**

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
6. **Using magic numbers/strings** - always use constants from `constants.ts`
7. **Duplicating validation logic** - use validators from `validators.ts`
8. **Duplicating download logic** - use file utilities from `file-utils.ts`

## Best Practices with Examples

### ❌ Bad: Magic Numbers and Strings

```typescript
// DON'T DO THIS
const MAX_SIZE = 10 * 1024 * 1024;
if (file.size > MAX_SIZE) {
  alert('Arquivo muito grande. O limite é 10 MB.');
}

const dateStr = '20240101';
const day = dateStr.substring(6, 8);
const month = dateStr.substring(4, 6);
```

### ✅ Good: Use Constants

```typescript
// DO THIS
import { MAX_FILE_SIZE, ERROR_MESSAGES, OFX_DATE_INDICES } from '@/lib/constants';

if (file.size > MAX_FILE_SIZE) {
  alert(ERROR_MESSAGES.FILE_TOO_LARGE);
}

const day = dateStr.substring(OFX_DATE_INDICES.DAY_START, OFX_DATE_INDICES.DAY_END);
const month = dateStr.substring(OFX_DATE_INDICES.MONTH_START, OFX_DATE_INDICES.MONTH_END);
```

### ❌ Bad: Duplicate Validation Logic

```typescript
// DON'T DO THIS - duplicated in multiple files
if (file.size > 10 * 1024 * 1024) {
  return NextResponse.json({ error: 'Too large' }, { status: 413 });
}

if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
  // Process PDF
}
```

### ✅ Good: Use Validators

```typescript
// DO THIS
import { isFileSizeValid, isPdfFile } from '@/lib/validators';
import { ERROR_MESSAGES } from '@/lib/constants';

if (!isFileSizeValid(file)) {
  return NextResponse.json({ error: ERROR_MESSAGES.FILE_TOO_LARGE }, { status: 413 });
}

if (isPdfFile(file)) {
  // Process PDF
}
```

### ❌ Bad: Duplicate Download Logic

```typescript
// DON'T DO THIS - blob handling duplicated
const blob = new Blob([content], { type: 'application/x-ofx' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'fatura.ofx';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

### ✅ Good: Use File Utilities

```typescript
// DO THIS
import { downloadTextFile } from '@/lib/file-utils';
import { UI_CONSTANTS } from '@/lib/constants';

downloadTextFile(content, UI_CONSTANTS.DEFAULT_OFX_FILENAME, 'application/x-ofx');
```

### ❌ Bad: Multiple OR Conditions

```typescript
// DON'T DO THIS
if (line.startsWith('Lançamentos:') || line.startsWith('Lançamentos no cartão')) {
  // ...
}
```

### ✅ Good: Use Marker Arrays

```typescript
// DO THIS
import { ITAU_TRANSACTION_START_MARKERS } from '@/lib/constants';

if (ITAU_TRANSACTION_START_MARKERS.some(marker => line.startsWith(marker))) {
  // ...
}
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
