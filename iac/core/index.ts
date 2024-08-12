import * as pulumi from '@pulumi/pulumi'
import * as gcp from '@pulumi/gcp'
import * as random from '@pulumi/random'

const gcpConfig = new pulumi.Config('gcp')
const region = gcpConfig.require('region')
const project = gcpConfig.require('project')

const config = new pulumi.Config()

const databasePasswordGen = new random.RandomPassword('db-password', {
    length: 32,
    special: false,
})

const jwtSecretGen = new random.RandomPassword('jwt-secret', {
    length: 36,
    special: false,
})

// Sharing this database for development, staging and production
const databaseInstance = new gcp.sql.DatabaseInstance('app-db-instance', {
    // name: 'solvemate-ai-default',
    name: 'awaazesehat-main',
    deletionProtection: false,
    databaseVersion: 'POSTGRES_13',
    region: region,
    settings: {
        availabilityType: 'REGIONAL',
        tier: 'db-f1-micro',
        backupConfiguration: {
            enabled: true,
            pointInTimeRecoveryEnabled: true,
            backupRetentionSettings: {
                retainedBackups: 7,
            },
        },
        ipConfiguration: {
            ipv4Enabled: true,
            authorizedNetworks: [
                {
                    name: 'Allow Allow',
                    value: '0.0.0.0/0',
                },
            ],
        },
        diskSize: 10,
    },
})

const databaseUser = new gcp.sql.User('db-user', {
    instance: databaseInstance.id,
    name: 'postgres',
    password: databasePasswordGen.result,
})

const applicationServiceAccount = new gcp.serviceaccount.Account('application-service-account', {
    accountId: 'awaazesehatapp',
})

const applicationServiceAccountKey = new gcp.serviceaccount.Key('application-sa-key', {
    serviceAccountId: applicationServiceAccount.accountId,
})

const appServiceAccountKeySecret = new gcp.secretmanager.Secret('app-sa-key-secret', {
    secretId: 'application-service-account-secret-key',
    replication: {
        auto: {},
    },
})

const appServiceAccountKeySecretVersion = new gcp.secretmanager.SecretVersion('app-sa-key-secret-version', {
    secret: appServiceAccountKeySecret.name,
    secretData: applicationServiceAccountKey.privateKey.apply((base64) =>
        Buffer.from(base64, 'base64').toString('utf-8')
    ),
})

new gcp.projects.IAMMember('secret-accessor-iam-binding', {
    member: applicationServiceAccount.member,
    role: 'roles/secretmanager.secretAccessor',
    project,
})

new gcp.projects.IAMMember('storage-admin-binding', {
    member: applicationServiceAccount.member,
    role: 'roles/storage.admin',
    project,
})

/**
 * We Would be creating a Docker Repository for storing our application packages.
 * This repository is for the Core Server Application.
 */
const coreServerDockerRepo = new gcp.artifactregistry.Repository('core-server-docker-repo', {
    repositoryId: 'awaaz-core-server',
    format: 'DOCKER',
    location: region,
})

export const jwtSecret = jwtSecretGen.result
export const appSAKeySecretId = appServiceAccountKeySecret.secretId
export const serviceAccountEmail = applicationServiceAccount.email
export const artifactRegistryName = coreServerDockerRepo.name
export const keyfileContent = appServiceAccountKeySecretVersion.secretData

// exporting Database details
export const databaseInstanceName = databaseInstance.name
export const databaseHost = databaseInstance.publicIpAddress
export const databaseUsername = databaseUser.name
export const databasePassword = databaseUser.password
