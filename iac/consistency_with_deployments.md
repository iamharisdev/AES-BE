# Ensuring Cloud Run Image Consistency with Pulumi

## Introduction

Managing infrastructure as code (IaC) with Pulumi can sometimes lead to unintended disruptions in your production environment. One common issue is the reversion of a Cloud Run service image to a default one, which can cause downtime. This document explains a strategy to prevent such issues by always fetching the latest image from the Cloud Run service before applying any updates.

## Problem Statement

In our current setup, updating variables in our Pulumi configuration sometimes reverts the Cloud Run service image to a default one, such as a minimalistic server image. This unintended behavior can cause our production environment to go down, leading to significant stress and potential downtime.

## Solution

To mitigate this issue, we have implemented a strategy where, before Pulumi calculates the differences and applies updates, it fetches the current state of the Cloud Run service and uses the latest image for its next update. This ensures that the image is always up-to-date and prevents the reversion to a default image.

## Detailed Explanation

### Original Problem

When managing Cloud Run services with Pulumi, updating configuration variables can sometimes cause the service to revert to a default image. This is problematic because it can lead to the deployment of a minimalistic server image, which is not suitable for production and can cause downtime.

### Why Use a Minimalistic Server Image as Default?

The minimalistic server image is used as a default for the first-time creation of the Cloud Run service. This ensures that the service can be created even if the actual application image is not yet available. However, this default image should not be used for subsequent updates, as it is not intended for production use.

### Workflow Explanation

In our setup, everything related to the Cloud Run resource is managed by Pulumi, except for the container image. The container image is managed by GitHub Actions, which is responsible for building the image and creating a new revision (deployment).

1. **GitHub Actions**: This workflow builds the container image and deploys it to a container registry. It then creates a new revision of the Cloud Run service using this image.
   
2. **Pulumi**: Manages the rest of the Cloud Run service configuration, such as environment variables, secrets, and other settings. Before applying any updates, Pulumi fetches the current state of the Cloud Run service to get the latest image.

### Example Workflow

1. **GitHub Actions** builds the container image and pushes it to a container registry.
2. **GitHub Actions** creates a new revision of the Cloud Run service using the new image.
3. **Pulumi** fetches the current state of the Cloud Run service, including the latest image.
4. **Pulumi** applies any configuration updates, ensuring that the latest image is used.

### Potential Race Conditions

There is a slight chance of a race condition where a GitHub Action might update the image while Pulumi is fetching the current state. However, this is a rare occurrence and, if it happens, it is less problematic compared to the service reverting to a default image. A successful build not deploying is better than creating a revision that defaults to a minimalistic server image.

By following this strategy, you can maintain a robust and stable production environment, minimizing the risk of downtime and other issues caused by unintended image reversion.