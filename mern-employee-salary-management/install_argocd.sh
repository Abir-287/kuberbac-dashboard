#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting ArgoCD Installation..."

# 1. Create Namespace
echo "Creating 'argocd' namespace..."
kubectl create namespace argocd || echo "Namespace 'argocd' already exists."

# 2. Install ArgoCD
echo "Applying ArgoCD manifests (Server-Side)..."
kubectl apply --server-side --force-conflicts -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for components to be ready
echo "Waiting for ArgoCD server to be ready (this may take a minute)..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# 4. Get Admin Password
echo "Retrieving initial admin password..."
PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "---------------------------------------------------"
echo "✅ ArgoCD Installation Complete!"
echo "---------------------------------------------------"
echo "🌐 URL: https://argocd.abir.local"
echo "👤 Username: admin"
echo "🔑 Password: $PASS"
echo "---------------------------------------------------"
echo "Access ArgoCD via NGINX Ingress (MetalLB LoadBalancer):"
echo "  https://argocd.abir.local"
echo "---------------------------------------------------"
echo "Make sure your /etc/hosts contains:"
echo "  192.168.122.200  argocd.abir.local dashboard.abir.local"
