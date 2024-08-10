import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as random from "@pulumi/random";

const awsConfig = new pulumi.Config("aws");

const password = new random.RandomPassword("db-password", {
    length: 24,
    special: false,
})

// Create a Security Group
const dbSecurityGroup = new aws.ec2.SecurityGroup("mydbSg", {
    description: "Allow inbound traffic",
    ingress: [{
        fromPort: 5432,
        toPort: 5432,
        protocol: "tcp",
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Create Database Instance
const databaseInstance = new aws.rds.Instance("main-db", {
    // Metadata
    identifier: "awaaz-sehat-main",
    username: "postgres",
    password: password.result,

    // Database Engine Details
    engine: "postgres",
    engineVersion: "14.10",

    // Compute Capacity
    instanceClass: aws.rds.InstanceType.T3_Micro,

    // Storage Capacity
    allocatedStorage: 32,
    storageType: "gp2",

    // Backup Configuration
    backupRetentionPeriod: 7,
    deleteAutomatedBackups: false,

    // Monitoring
    enabledCloudwatchLogsExports: ["postgresql"],

    // Configure Networking and Firewalls
    publiclyAccessible: true,
    vpcSecurityGroupIds: [dbSecurityGroup.id],
});

const appIamUser = new aws.iam.User("app-iam-user", {
    name: "awaaz-app-user"
});

const appIamUserKey = new aws.iam.AccessKey("core-app-iam-access-key", {
    user: appIamUser.name,
})

// Exporting Name of User, Access ID, and Access Secret
export const appIamUserName = appIamUser.name;
export const appIamAccessId = appIamUserKey.id;
export const appIamAccessKey = appIamUserKey.secret;

// exporting Database details
export const databaseInstanceName = databaseInstance.identifier;
export const databaseHost = databaseInstance.address;
export const databaseUsername = databaseInstance.username;
export const databasePassword = databaseInstance.password;

// Docker command to connect to PostgreSQL using Alpine-based image
export const connectionCommand = pulumi.interpolate`docker run --rm -it -e PGPASSWORD=${databasePassword} postgres:${databaseInstance.engineVersion}-alpine psql -h ${databaseHost} -U ${databaseUsername}`;