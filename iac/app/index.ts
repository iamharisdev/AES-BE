import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

// Environment Variables
const awsConfig = new pulumi.Config('aws')
const region = awsConfig.require('region')

// Reference to Stack Outputs For Parent Stack
const coreStackReference = new pulumi.StackReference(`organization/core-app/default`)

const databaseInstanceName = coreStackReference.requireOutput('databaseInstanceName')
const databaseUsername = coreStackReference.requireOutput('databaseUsername')
const databasePassword = coreStackReference.requireOutput('databasePassword')

const appIamUserName = coreStackReference.requireOutput('appIamUserName')
const appIamAccessId = coreStackReference.requireOutput('appIamAccessId')
const appIamAccessKey = coreStackReference.requireOutput('appIamAccessKey')

// Using the Stack Name as The Environment Name
const environment = pulumi.getStack()

/**
 * We Would be creating a Docker Repository for storing our application packages.
 * This repository is for the Core Server Application.
 */
const coreServerDockerRepo = new aws.ecr.Repository('core-server-docker-repo', {
    name: `awaaz-core-server-${environment}`,

    // For Metadata Purposes
    tags: {
        ProjectName: 'awaaz-core-server',
        EnvironmentType: environment,
    },
})

/**
 * Let's also create a S3 Bucket for Storing any kind of files like:
 * - EMR Audio Files
 * - Big data blobs
 */
const uploadsBucket = new aws.s3.Bucket('uploads-bucket', {
    bucket: `awaaz-sehat-uploads-${environment}`,
})

/**
 * Host our Core Server On App Runner
 */
// const coreServerAppRunnerConfig = new aws.apprunner.Auto("core-server-")

const coreServerAppRunnerService = new aws.apprunner.Service('core-server-service', {
    serviceName: `awaaz-core-server-${environment}`,
    sourceConfiguration: {
        imageRepository: {
            imageConfiguration: {
                port: '8000',
                runtimeEnvironmentSecrets: {},
                runtimeEnvironmentVariables: {},
            },
            // TODO: It should use the reference to our core service repository
            imageIdentifier: 'public.ecr.aws/aws-containers/hello-app-runner:latest',
            imageRepositoryType: 'ECR_PUBLIC',
        },
        // should be set to true
        autoDeploymentsEnabled: false,
    },
    instanceConfiguration: {
        cpu: '256',
        memory: '512',
        // This might be equivalent to the GCP Service Account but i am not sure.
        // instanceRoleArn: "???",
    },
})

export const coreServerRepo = coreServerDockerRepo.name
export const coreServiceUrl = coreServerAppRunnerService.serviceUrl
export const uploadBucketName = uploadsBucket.bucket
