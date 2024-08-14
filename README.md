# Awaaz E Sehat

This is the mono repo for the Awaaz-e-Sehat System. The monorepo Approach is used to make it easier to work and collaborate among the developers. This Mono repository has all codebases for different packages. Since we use AWS as our cloud provider, we would be automating our infrastructure using `Infrastructure As Code` Tools like `Pulumi`.

**Note:** Any Infrastucture Changes Related to this project should _strictly_ be done through `Pulumi` and not outside of it through dashboard.

## Contributuing Guide

### Consistent Formatting

According to this [Article](https://graphite.dev/guides/how-to-resolve-merge-conflicts-in-git#best-practices-for-handling-merge-conflicts) Most of the Merge conflicts arise from inconsistent formatting styles.

For this specific project, `.vscode` and `.prettierr` are setup and the purpose of this is to have consistent formatting across different environment for all contributers. For example, prettier settings in this project does not allow semicolons at end of lines for `js/ts` files and add trailing commas. These changes take should take effect `On File Save`. However, if they dont you need to configure prettier correctly on your system. For this project, I assume you are using vscode so `.vscode` defaults should work but if you use any other editor you should configure prettier with it as well. It is your responsibility to configure your local dev environment correctly work with the formatting Guidelines for this project. See `.prettierr`.

### Other Tips

- **Prevention is best:** Keep your branches short-lived and merge them frequently to minimize conflicts. Always follow [best pull request practices](https://graphite.dev/blog/code-review-best-practices).

- **Regularly fetch and merge:** Stay updated with changes in your repository to avoid large, complex conflicts.

## Project Organization

_todo_

## Directory Structure

```bash
# related to Infrastructure As Code
- iac 

# source code for our core server
- core-server
```
