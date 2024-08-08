#!/bin/bash

# Pulumi Docs Reference:
# S3 as State Backend: https://www.pulumi.com/docs/concepts/state/#aws-s3
# Encrypting Secrets: https://www.pulumi.com/docs/concepts/secrets/#available-encryption-providers

# Variables
BUCKET_NAME="awaaz-sehat-pulumi"
AWS_REGION="ap-southeast-1"
KEY_ALIAS="alias/pulumi-iac-key"
KEY_DESCRIPTION="Pulumi Infrastructure as Code for encryption"
ROTATION_PERIOD_DAYS=30

# Function to check if S3 bucket exists
function check_s3_bucket_exists {
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        echo "S3 bucket $BUCKET_NAME already exists."
        return 0
    else
        return 1
    fi
}

# Function to check if KMS key alias exists
function check_kms_key_alias_exists {
    if aws kms list-aliases --query "Aliases[?AliasName=='$KEY_ALIAS']" --output text | grep -q "$KEY_ALIAS"; then
        echo "KMS key alias $KEY_ALIAS already exists."
        return 0
    else
        return 1
    fi
}

# Create S3 bucket if it doesn't exist
if ! check_s3_bucket_exists; then
    aws s3api create-bucket --bucket $BUCKET_NAME --region $AWS_REGION --create-bucket-configuration LocationConstraint=$AWS_REGION
    echo "S3 bucket $BUCKET_NAME created."
fi

# Create KMS key and alias if they don't exist
if ! check_kms_key_alias_exists; then
    KEY_ID=$(aws kms create-key --description "$KEY_DESCRIPTION" --query KeyMetadata.KeyId --output text)
    aws kms create-alias --alias-name $KEY_ALIAS --target-key-id $KEY_ID
    aws kms enable-key-rotation --key-id $KEY_ID
    echo "KMS key and alias $KEY_ALIAS created and key rotation enabled."
else
    KEY_ID=$(aws kms list-aliases --query "Aliases[?AliasName=='$KEY_ALIAS'].TargetKeyId" --output text)
fi

# Provide the user with the necessary Pulumi commands
echo "To configure Pulumi to use the new backend and KMS key, run the following commands:"
echo "1. Navigate to your Pulumi project directory:"
echo "   cd /path/to/your/pulumi/project"
echo "2. Log in to the Pulumi backend using the S3 bucket:"
echo "      pulumi login s3://$BUCKET_NAME"
echo "3. Change the secrets provider to use the new KMS key:"
echo "      pulumi stack change-secrets-provider \"awskms://$KEY_ID?region=$AWS_REGION\""

echo "S3 bucket, KMS key, and Pulumi stack secrets provider have been successfully configured."