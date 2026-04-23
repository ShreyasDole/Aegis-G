#!/usr/bin/env bash
# ============================================
# 🛡️ Aegis-G — Azure Deploy Script
# ============================================
# One-shot script to build, push, and deploy
# the backend to Azure Container Apps.
#
# Prerequisites (run once):
#   az login
#   az extension add --name containerapp --upgrade
#   az provider register --namespace Microsoft.App
#   az provider register --namespace Microsoft.OperationalInsights
#
# Usage:
#   chmod +x azure-deploy.sh
#   ./azure-deploy.sh
# ============================================
set -euo pipefail

# ── Config — edit these ────────────────────────────────────────────────────────
RESOURCE_GROUP="aegis-rg"
LOCATION="eastus"                         # or centralindia, westeurope, etc.
ACR_NAME="aegisregistry"                  # must be globally unique, lowercase
CONTAINER_APP_NAME="aegis-backend"
CONTAINER_APP_ENV="aegis-env"
IMAGE_NAME="aegis-backend"
TAG="${1:-latest}"                        # pass version as arg, e.g. ./azure-deploy.sh v1.2

IMAGE_FULL="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG}"

echo ""
echo "🚀 Aegis-G Azure Deploy"
echo "   Resource Group : $RESOURCE_GROUP"
echo "   Location       : $LOCATION"
echo "   ACR            : $ACR_NAME"
echo "   Image          : $IMAGE_FULL"
echo ""

# ── Step 1: Create Resource Group (idempotent) ────────────────────────────────
echo "📦 Step 1/6 — Resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none
echo "   ✅ $RESOURCE_GROUP"

# ── Step 2: Create Azure Container Registry ────────────────────────────────────
echo "🏗️  Step 2/6 — Container Registry..."
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none 2>/dev/null || echo "   (ACR already exists, skipping create)"
echo "   ✅ $ACR_NAME.azurecr.io"

# ── Step 3: Build & push image using ACR build (no local Docker daemon needed) ─
echo "🐳 Step 3/6 — Build & push image..."
echo "   Building from repo root with Dockerfile.azure..."
az acr build \
    --registry "$ACR_NAME" \
    --image "${IMAGE_NAME}:${TAG}" \
    --file Dockerfile.azure \
    .
echo "   ✅ Image pushed: $IMAGE_FULL"

# ── Step 4: Create Container Apps Environment ──────────────────────────────────
echo "🌐 Step 4/6 — Container Apps environment..."
az containerapp env create \
    --name "$CONTAINER_APP_ENV" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || echo "   (Environment already exists, skipping create)"
echo "   ✅ $CONTAINER_APP_ENV"

# ── Step 5: Get ACR credentials ───────────────────────────────────────────────
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# ── Step 6: Deploy Container App ──────────────────────────────────────────────
echo "🚢 Step 5/6 — Deploying Container App..."
echo "   ℹ️  Set environment variables in Azure Portal after first deploy."
echo "   ℹ️  See azure.env.example for the required variables."

az containerapp create \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINER_APP_ENV" \
    --image "$IMAGE_FULL" \
    --registry-server "${ACR_NAME}.azurecr.io" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 8000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --env-vars \
        ENVIRONMENT=production \
        PORT=8000 \
        WEBSITES_PORT=8000 \
    --output none 2>/dev/null || \
az containerapp update \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$IMAGE_FULL" \
    --output none

# ── Get URL ────────────────────────────────────────────────────────────────────
echo ""
BACKEND_URL=$(az containerapp show \
    --name "$CONTAINER_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" \
    --output tsv)

echo "   ✅ $CONTAINER_APP_NAME deployed!"
echo ""
echo "🎉 Step 6/6 — Done!"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│  Backend URL : https://${BACKEND_URL}"
echo "│  Health     : https://${BACKEND_URL}/health"
echo "│  API Docs   : https://${BACKEND_URL}/docs"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "⚠️  Next steps:"
echo "   1. Go to Azure Portal → Container Apps → $CONTAINER_APP_NAME → Environment variables"
echo "   2. Paste values from azure.env.example (with real credentials)"
echo "   3. Deploy frontend to Vercel, set NEXT_PUBLIC_API_URL=https://${BACKEND_URL}"
echo ""
