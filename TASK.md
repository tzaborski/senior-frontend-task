# First things first 

Before starting the implementation I completed an in-depth review of the repository to understand its current state, dependencies, and potential risks.


## **Dependency audit**

The project relies on several outdated dependencies, which increases the likelihood of security vulnerabilities and incompatibilities with modern tooling.

- Initial install reported **2 known vulnerabilities**
- Some core libraries were behind current stable versions
- Documentation for certain packages can no longer align with the installed versions

  

Given the relatively small scope of the project, I decided to:
- Upgrade all core dependencies to their latest stable versions
- Ensure compatibility with current documentation and ecosystem standards
- Eliminate known vulnerabilities reported by the package manager

## **Test setup (Vitest)**

To improve reliability and maintainability I introduced unit testing via Vitest.

Adding a test layer at this stage ensures that future changes can be made with confidence, especially after upgrading dependencies. It also establishes a foundation for preventing regressions as the codebase evolves.

## **Tooling & Code Quality (DX)**

Project now uses ESLint, Prettier, and Husky to enforce consistent code quality and prevent broken commits.
 

- ESLint - statically analyzes code to catch bugs and enforce Vue/JS best practices.

- Prettier - handles formatting (indentation, quotes, line length) so style is never debated in code review.

- Husky - manages Git hooks via a tracked `.husky/` directory. A pre-commit hook runs lint, format, and tests before every commit, catching issues before they enter Git history.

# Task 1: Refactor

For refactoring I prefer using AI tools such as Claude Code and OpenAI Codex as supporting tools. They are particularly effective for repetitive transformations and codebase-wide consistency, while all architectural decisions and final validations were done manually.

## 1a. Extracting `fmtTime()` to `src/utils/format.js`

The `fmtTime()` function was duplicated across multiple components. I extracted it into a shared utility to eliminate redundancy and ensure consistency.

### Prompt used
> Extract `fmtTime()` into a reusable function and place it inside `src/utils/format.js`. Notice copy of this function is used across different components so those should be updated accordingly after extracting. Check and update `@src/components/ChunkPanel.vue` `@src/components/PartPanel.vue` `@src/components/SourcesView.vue` and all other components afterwards. 
> Now add vitest based unit tests for newly created `format.js`

### Result
- Centralized implementation in `src/utils/format.js`
- Updated all component usages
- Added unit tests using `Vitest` to ensure corectness and prevent regressions

## 1b. Extracting `TYPE_LABELS` and `TYPE_COLORS` 

Two shared mappings were defined in separate components, despite representing the same domain concept.

### Prompt used
> `@src/components/ChunkPanel.vue` defines `TYPE_LABELS` and `@src/components/Graph.vue` defines `TYPE_COLORS`. Extract into reusable `src/utils/types.js` file that exports both maps and then update all related components.

### Result
-  Created  `src/utils/types.js`  with shared exports
-  Replaced duplicated definitions across components
-  Improved consistency and maintainability of type-related configuration

## 1c. Add `i18n` support and translate interface to Polish

This is where AI tools really shine. No need for manual translations as both Claude / Codex usually nail more of a technical strings into languages. I used Claude to extract all strings to separate locales. Instead of going with already outdated `vue-i18n@9` I decided to use the lastest, actively maintained version 11. Claude decided to ditch `TYPE_LABELS` at this point and I'm being fine with that given that those labels tend to reoccur and are easialy translatable to other languages.


### Prompt used
> `@src/components/ChunkPanel.vue` defines `TYPE_LABELS` and `@src/components/Graph.vue` defines `TYPE_COLORS`. Extract into reusable `src/utils/types.js` file that exports both maps and then update all related components.

### Result
- Integrated `vue-i18n` (latest version instead of v9)
- Extracted all UI strings into structured locale files
- Added Polish (**pl**) translations
- Replaced hardcoded labels with translation keys

During this step, `TYPE_LABELS` became redundant and was removed in favor of localized strings. Since these labels are user-facing, managing them through i18n provides better flexibility and scalability.