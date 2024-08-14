# Infrastructure As Code (IaC)

We would be using Pulumi (Typescript) to **declaratively** define our Cloud Infrastructure.

It is important to understand how IaC tools like Pulumi Works before getting started on this. Refer to Important Concepts at the End. There is a rich docs for most concepts.

## Conceptual Guide

### Backend State

Since Each Pulumi Project has a state file for tracking the current state of the infrastructure, it needs to live somewhere. Having it locally does not make sense for the following reasons:

1. State Files Have Sensitive Values And Pushing Them to Version Control (Github) Does Not Make Sense.

2. Each Developers having local state copies on their machine can lead to situation where multiple developer working on the infrastructure can lead to multiple source of truths and Race Condition. It's a bad thing so let's dont discuss this

So! What is the solution then?

### S3 as State Backend

We Need to Create A Storage Bucket for hosting state backend file. We would also need an enterprise grade managed enryption service such as GCP KMS to encrypts our secrets. Pulumi handles secrets out of the box, we just need to configure them.

So, we need to create a Cloud Storage Bucket and KMS keys. Now, We can't use Pulumi to create these because we need these to initialize a Pulumi Project. This creates a `chicken and egg` problem. So, only for this time, we would create these resources outside of pulumi using the AWS CLI.

After that we would be using pulumi to manage all resources.

## Get Started

### Gcloud CLI

Download the AWS CLI.

```bash
# Authenticate
gcloud init

gcloud auth application-default login
```

### Pulumi CLI

Well you also need Pulumi CLI, NodeJs and PNPM (I dont like npm);

```bash
# assuming node installed, download pnpm
npm install -g pnpm
```

Then Use the GCP Cloud Storage Bucket to Authenticate the Pulumi.

```bash
pulumi login gs://awaaz-sehat-pulumi
```

### Applying Changes to Existing Projects

`cd` into the relevant project. `core` or `app`, make changes to infra.

```bash
cd iac/core 
# or
cd iac/app

# Install Dependencies
pnpm install

# apply changes
pulumi up
```

---

_TODO: create docs for creating new backend for first time, initialzing and registering new pulumi projects_

---

## Doc References

- [How Pulumi Works](https://www.pulumi.com/docs/concepts/how-pulumi-works/)
- [State Backend Concept](https://www.pulumi.com/docs/concepts/state/)
- [Pulumi Projects](https://www.pulumi.com/docs/concepts/projects/)
- [Stack in a Pulumi Project](https://www.pulumi.com/docs/concepts/stack/)

I mean I can add more links but feel free to browse the docs and see other concepts such as Inputs, Outputs, Stack References, Environment Variables, and Secrets as well.
