# Awaaz E Sehat

This is the mono repo for the Awaaz-e-Sehat System. The monorepo Approach is used to make it easier to work and collaborate among the developers. This Mono repository has all codebases for different packages. Since we use AWS as our cloud provider, we would be automating our infrastructure using `Infrastructure As Code` Tools like `Pulumi`.

**Note:** Any Infrastucture Changes Related to this project should _strictly_ be done through `Pulumi` and not outside of it through dashboard. 

## Project Organization

_todo_

## Directory Structure

```bash
# related to Infrastructure As Code
- iac 

# source code for our services (core server, analytics etc)
- services 
```