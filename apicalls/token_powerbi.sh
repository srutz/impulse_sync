#!/bin/bash

source ./.env

curl -s -X POST \
  "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://storage.azure.com/.default" \
  -d "grant_type=client_credentials" | jq -r '.access_token'
