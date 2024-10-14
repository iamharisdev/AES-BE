import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
// Environment Variables
const gcpConfig = new pulumi.Config('gcp')
const region = gcpConfig.require('region')
const project = gcpConfig.require('project')

const config = new pulumi.Config()

// Reference to Stack Outputs For Parent Stack
const coreStackReference = new pulumi.StackReference(`organization/core-app/default`)

const databaseHost = coreStackReference.requireOutput('databaseHost')
const databaseInstanceName = coreStackReference.requireOutput('databaseInstanceName')
const databaseUsername = coreStackReference.requireOutput('databaseUsername')
const databasePassword = coreStackReference.requireOutput('databasePassword')

const jwtSecret = coreStackReference.requireOutput('jwtSecret')
const serviceAccountEmail = coreStackReference.requireOutput('serviceAccountEmail')
const appSAKeySecretId = coreStackReference.requireOutput('appSAKeySecretId')
const artifactRegistryName = coreStackReference.requireOutput('artifactRegistryName')

const OPENAI_API_KEY = config.requireSecret('OPENAI_API_KEY')

const DEFAULT_CLOUD_RUN_IMAGE = 'umernaeem/minimalistic-server'

// Using the Stack Name as The Environment Name
const environment = pulumi.getStack()

/**
 * Let's also create a S3 Bucket for Storing any kind of files like:
 * - EMR Audio Files
 * - Big data blobs
 */
const uploadsBucket = new gcp.storage.Bucket('uploads-bucket', {
	name: `awaaz-sehat-uploads-${environment}`,
	location: region,
	cors: [{
		origins: ['*'],
		methods: ['*'],
		responseHeaders: ['*'],
		maxAgeSeconds: 3600,
	}],
})

const database = new gcp.sql.Database('database', {
	name: environment,
	instance: databaseInstanceName,
})

/**
 * Host our Core Server On Cloud Run (Fully Managed Serverless Service)
 */
const coreServerName = `core-server-${environment}`

/**
 * Retrieve the latest image from cloud run to use
 * This Way to getting the image of the latest cloud run revision
 * safeguards us from reverting the image to default one and disruption
 * our production workflow
 */
const imageInput = gcp.cloudrunv2
	.getService({
		name: coreServerName,
		location: region,
	})
	.then((res) => res.templates[0].containers[0].image)
	// If there is an error, use default image
	.catch(() => DEFAULT_CLOUD_RUN_IMAGE)
	.finally(console.log)

const coreServerService = new gcp.cloudrunv2.Service('core-server-service', {
	name: coreServerName,
	location: region,
	ingress: 'INGRESS_TRAFFIC_ALL',
	template: {
		serviceAccount: serviceAccountEmail,
		volumes: [
			{
				name: 'keyfile-volume',
				secret: {
					secret: appSAKeySecretId,
					defaultMode: 292,
					items: [
						{
							version: '1',
							path: 'keyfile.json',
						},
					],
				},
			},
			// {
			//     name: 'cloudsql',
			//     cloudSqlInstance: {
			//         instances: [cloudSqlInstanceConnectionName],
			//     },
			// },
		],
		containers: [
			{
				image: imageInput,
				volumeMounts: [
					{
						name: 'keyfile-volume',
						mountPath: '/secrets',
					},
					// {
					//     name: 'cloudsql',
					//     mountPath: '/cloudsql',
					// },
				],
				ports: [
					{
						containerPort: 8000,
					},
				],
				envs: [
					{ name: 'DATABASE_HOST', value: databaseHost },
					{ name: 'DATABASE_USERNAME', value: databaseUsername },
					{ name: 'DATABASE_PASSWORD', value: databasePassword },
					{ name: 'DATABASE_NAME', value: database.name },
					{ name: 'JWT_SECRET', value: jwtSecret },
					{ name: 'KEYFILE_PATH', value: '/secrets/keyfile.json' },
					{ name: 'OPENAI_API_KEY', value: OPENAI_API_KEY },
					{ name: 'UPLOAD_BUCKET', value: uploadsBucket.name },
					{ name: 'ENVIRONMENT_TYPE', value: environment },
					// PORT env is automatically provided by cloud run
					// { name: 'PORT', value: '8000' },
				],
			},
		],
	},
})

// Allow Unauthenticated Access
const noauth = gcp.organizations.getIAMPolicy({
	bindings: [
		{
			role: 'roles/run.invoker',
			members: ['allUsers'],
		},
	],
})

const noauthIamPolicy = new gcp.cloudrun.IamPolicy('noauth', {
	location: coreServerService.location,
	project: coreServerService.project,
	service: coreServerService.name,
	policyData: noauth.then((noauth) => noauth.policyData),
})

// Allow the CICD SA to act as the Run Service Account
// gcloud iam service-accounts add-iam-policy-binding awaazesehatapp@awaz-e-sehat.iam.gserviceaccount.com \
//   --member="serviceAccount:cicdpipeline@awaz-e-sehat.iam.gserviceaccount.com" \
//   --role="roles/iam.serviceAccountUser" \
//   --project="awaz-e-sehat"

export const coreServiceUrl = coreServerService.uri
export const uploadBucketName = uploadsBucket.name
