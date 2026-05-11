#!/bin/bash
# Add hosts entries for Ingress
HOSTS_LINE="192.168.122.200  argocd.abir.local dashboard.abir.local"
if grep -q "argocd.abir.local" /etc/hosts; then
    # Update existing line
    sed -i "s/.*argocd\.abir\.local.*/$HOSTS_LINE/" /etc/hosts
    echo "Updated existing hosts entry"
else
    echo "$HOSTS_LINE" >> /etc/hosts
    echo "Added new hosts entry"
fi
echo "Current abir.local entries:"
grep "abir.local" /etc/hosts
