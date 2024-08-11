#!/bin/bash
# Pulumi Docs Reference:
# GCS as State Backend: https://www.pulumi.com/docs/concepts/state/#google-cloud-storage
# Encrypting Secrets: https://www.pulumi.com/docs/concepts/secrets/#available-encryption-providers

# Variables
PROJECT_ID="awaz-e-sehat"
BUCKET_NAME="awaaz-sehat-pulumi"
GCP_REGION="asia-southeast1"
KEY_RING_NAME="pulumi-key-ring"
KEY_NAME="pulumi-iac-key"
KEY_PURPOSE="encryption"
ROTATION_PERIOD_DAYS=30

# Enable necessary Google Cloud services
# Only needed for first time on a new project / comment out to save time
gcloud services enable storage.googleapis.com --project $PROJECT_ID
gcloud services enable cloudkms.googleapis.com --project $PROJECT_ID
gcloud services enable artifactregistry.googleapis.com --project $PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project $PROJECT_ID
gcloud services enable cloudfunctions.googleapis.com --project $PROJECT_ID
gcloud services enable compute.googleapis.com --project $PROJECT_ID
gcloud services enable dns.googleapis.com --project $PROJECT_ID
gcloud services enable firebase.googleapis.com --project $PROJECT_ID
gcloud services enable iam.googleapis.com --project $PROJECT_ID
gcloud services enable pubsub.googleapis.com --project $PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project $PROJECT_ID
gcloud services enable run.googleapis.com --project $PROJECT_ID
gcloud services enable sqladmin.googleapis.com --project $PROJECT_ID
gcloud services enable firestore.googleapis.com --project $PROJECT_ID
gcloud services enable container.googleapis.com --project $PROJECT_ID
gcloud services enable fcm.googleapis.com --project $PROJECT_ID
gcloud services enable notebooks.googleapis.com --project $PROJECT_ID

# Function to check if GCS bucket exists
function check_gcs_bucket_exists {
    if gsutil ls -b "gs://$BUCKET_NAME" &>/dev/null; then
        echo "GCS bucket $BUCKET_NAME already exists."
        return 0
    else
        return 1
    fi
}

# Function to check if KMS key exists
function check_kms_key_exists {
    if gcloud kms keys list --keyring $KEY_RING_NAME --location $GCP_REGION --project $PROJECT_ID --filter="name:$KEY_NAME" --format="value(name)" | grep -q "$KEY_NAME"; then
        echo "KMS key $KEY_NAME already exists."
        return 0
    else
        return 1
    fi
}

# Create GCS bucket if it doesn't exist
if ! check_gcs_bucket_exists; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l $GCP_REGION "gs://$BUCKET_NAME"
    echo "GCS bucket $BUCKET_NAME created."
fi

# Create KMS key ring if it doesn't exist
if ! gcloud kms keyrings describe $KEY_RING_NAME --location $GCP_REGION --project $PROJECT_ID &>/dev/null; then
    echo "Creating KMS key ring"
    gcloud kms keyrings create $KEY_RING_NAME --location $GCP_REGION --project $PROJECT_ID
    echo "KMS key ring $KEY_RING_NAME created."
fi

# Create KMS key if it doesn't exist
if ! check_kms_key_exists; then
    echo "Creating KMS key"
    gcloud kms keys create $KEY_NAME --location $GCP_REGION --keyring $KEY_RING_NAME --purpose $KEY_PURPOSE --rotation-period "${ROTATION_PERIOD_DAYS}d" --next-rotation-time $(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "30 days") --project $PROJECT_ID
    echo "KMS key $KEY_NAME created and key rotation enabled."
fi

# Provide the user with the necessary Pulumi commands
echo "To configure Pulumi to use the new backend and KMS key, run the following commands:"
echo "1. Navigate to your Pulumi project directory:"
echo " cd /path/to/your/pulumi/project"
echo "2. Log in to the Pulumi backend using the GCS bucket:"
echo " pulumi login gs://$BUCKET_NAME"
echo "3. Change the secrets provider to use the new KMS key:"
echo " pulumi stack change-secrets-provider \"gcpkms://projects/$PROJECT_ID/locations/$GCP_REGION/keyRings/$KEY_RING_NAME/cryptoKeys/$KEY_NAME\""
echo "GCS bucket, KMS key, and Pulumi stack secrets provider have been successfully configured."