#!/bin/bash
# ============================================================
# DEX CERTIFICATE REGENERATION - Clean Setup
# Run this on the DEX VM: master@dex
# ============================================================

set -e

DEX_IP="192.168.122.23"
CERT_DIR="/etc/dex/certs"
CA_CRT="$CERT_DIR/dex-ca.crt"
CA_KEY="$CERT_DIR/dex-ca.key"
TMP="/tmp/dex_regen"

echo "======================================================"
echo "🔐 Dex Certificate Regeneration (Clean Setup)"
echo "======================================================"

# 1. Verify CA exists
echo ""
echo "📋 Step 1: Verifying CA certificate..."
if ! sudo test -f "$CA_CRT" || ! sudo test -f "$CA_KEY"; then
    echo "❌ ERROR: CA files not found at $CERT_DIR"
    exit 1
fi
echo "✅ CA Certificate: $CA_CRT"
echo "✅ CA Key: $CA_KEY"
sudo openssl x509 -in "$CA_CRT" -noout -subject -dates

# 2. Backup old certificates
echo ""
echo "📋 Step 2: Backing up old certificates..."
sudo mkdir -p "$CERT_DIR/backup"
[ -f "$CERT_DIR/dex.crt" ] && sudo cp "$CERT_DIR/dex.crt" "$CERT_DIR/backup/dex.crt.old"
[ -f "$CERT_DIR/dex.key" ] && sudo cp "$CERT_DIR/dex.key" "$CERT_DIR/backup/dex.key.old"
echo "✅ Old certs backed up to $CERT_DIR/backup/"

# 3. Delete old server certificate (NOT the CA!)
echo ""
echo "📋 Step 3: Removing old server certificate..."
sudo rm -f "$CERT_DIR/dex.crt" "$CERT_DIR/dex.key"
echo "✅ Old server certificate removed."

# 4. Create working directory
mkdir -p "$TMP"
cd "$TMP"

# 5. Create OpenSSL config with correct SANs
echo ""
echo "📋 Step 4: Creating OpenSSL config..."
cat > "$TMP/dex-csr.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = TN
ST = Sfax
L = Sfax
O = Sfax Kubernetes
OU = Infrastructure
CN = ${DEX_IP}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${DEX_IP}
DNS.1 = dex.local
DNS.2 = localhost
EOF
echo "✅ OpenSSL config created."

# 6. Generate new key and CSR
echo ""
echo "📋 Step 5: Generating new private key and CSR..."
openssl genrsa -out "$TMP/dex.key" 2048
openssl req -new -key "$TMP/dex.key" -out "$TMP/dex.csr" -config "$TMP/dex-csr.conf"
echo "✅ Private key and CSR generated."

# 7. Sign with the existing CA
echo ""
echo "📋 Step 6: Signing certificate with CA..."
sudo openssl x509 -req \
    -in "$TMP/dex.csr" \
    -CA "$CA_CRT" \
    -CAkey "$CA_KEY" \
    -CAcreateserial \
    -out "$TMP/dex.crt" \
    -days 365 \
    -sha256 \
    -extensions req_ext \
    -extfile "$TMP/dex-csr.conf"
echo "✅ Certificate signed."

# 8. Verify the new cert against the CA
echo ""
echo "📋 Step 7: Verifying certificate..."
openssl verify -CAfile "$CA_CRT" "$TMP/dex.crt"
echo "✅ Certificate verified against CA!"

# 9. Show SANs for confirmation
echo ""
echo "📋 Certificate Details:"
openssl x509 -in "$TMP/dex.crt" -noout -text | grep -A 5 "Subject Alternative Name"
openssl x509 -in "$TMP/dex.crt" -noout -dates

# 10. Install new certificates
echo ""
echo "📋 Step 8: Installing new certificates..."
sudo cp "$TMP/dex.crt" "$CERT_DIR/dex.crt"
sudo cp "$TMP/dex.key" "$CERT_DIR/dex.key"
sudo chown dex:dex "$CERT_DIR/dex.crt" "$CERT_DIR/dex.key"
sudo chmod 644 "$CERT_DIR/dex.crt"
sudo chmod 600 "$CERT_DIR/dex.key"
echo "✅ Certificates installed with correct ownership."

# 11. Update Dex config client ID to kubernetes_oidc
echo ""
echo "📋 Step 9: Updating Dex config client ID..."
sudo cp /etc/dex/config.yaml /etc/dex/config.yaml.bak
sudo sed -i 's/^- id: kubernetes$/- id: kubernetes_oidc/' /etc/dex/config.yaml
echo "Current static client config:"
sudo grep -A 3 "staticClients" /etc/dex/config.yaml
echo "✅ Config updated."

# 12. Restart Dex
echo ""
echo "📋 Step 10: Restarting Dex..."
sudo systemctl restart dex
sleep 3
sudo systemctl status dex --no-pager | head -15

# 13. Cleanup
rm -rf "$TMP"

echo ""
echo "======================================================"
echo "✅ Dex Certificate Regeneration Complete!"
echo "======================================================"
echo ""
echo "⚠️  NEXT: On the MASTER VM, run:"
echo ""
echo "  # Update OIDC client ID"
echo "  sudo sed -i 's/--oidc-client-id=kubernetes$/--oidc-client-id=kubernetes_oidc/' /etc/kubernetes/manifests/kube-apiserver.yaml"
echo ""
echo "  # Verify change"
echo "  grep oidc-client-id /etc/kubernetes/manifests/kube-apiserver.yaml"
echo ""
echo "  # Restart API Server"
echo "  kubectl delete pod kube-apiserver-master -n kube-system"
echo ""
echo "  # Test after 30 seconds"
echo "  sleep 30 && kubectl get pods -n argocd"
