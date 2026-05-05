
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