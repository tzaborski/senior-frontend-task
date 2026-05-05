
# First things first

Before starting the implementation I completed an in-depth review of the repository to understand its current state, dependencies, and potential risks.

**Dependency audit**
The project relies on several outdated dependencies, which increases the likelihood of security vulnerabilities and incompatibilities with modern tooling.
- Initial install reported **2 known vulnerabilities**
- Some core libraries were behind current stable versions
- Documentation for certain packages can no longer align with the installed versions

Given the relatively small scope of the project, I decided to:
- Upgrade all core dependencies to their latest stable versions
- Ensure compatibility with current documentation and ecosystem standards
- Eliminate known vulnerabilities reported by the package manager

**Test setup (Vitest)**
To improve reliability and maintainability I introduced unit testing via Vitest.

Adding a test layer at this stage ensures that future changes can be made with confidence, especially after upgrading dependencies. It also establishes a foundation for preventing regressions as the codebase evolves.

**Tooling & Code Quality (DX)**
Project now uses ESLint, Prettier, and Husky to enforce consistent code quality and prevent broken commits.

- ESLint - statically analyzes code to catch bugs and enforce Vue/JS best practices.
- Prettier - handles formatting (indentation, quotes, line length) so style is never debated in code review. 
- Husky - manages Git hooks via a tracked `.husky/` directory. A pre-commit hook runs lint, format, and tests before every commit, catching issues before they enter Git history. 