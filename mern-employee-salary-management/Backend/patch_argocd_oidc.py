import subprocess
import json

oidc_config = """
name: Dex
issuer: https://192.168.122.23:5556
clientID: argocd
clientSecret: argocd-secret-dex
requestedScopes: ["openid", "profile", "email", "groups"]
"""

patch = [
    {"op": "add", "path": "/data/url", "value": "https://192.168.122.220:32237"},
    {"op": "add", "path": "/data/oidc.config", "value": oidc_config.strip()}
]

cmd = ["kubectl", "patch", "cm", "argocd-cm", "-n", "argocd", "--type=json", "-p", json.dumps(patch)]
subprocess.run(cmd, check=True)

# Also update RBAC
rbac_policy = "g, cluster-admin, role:admin"
patch_rbac = [
    {"op": "add", "path": "/data/policy.csv", "value": rbac_policy}
]
cmd_rbac = ["kubectl", "patch", "cm", "argocd-rbac-cm", "-n", "argocd", "--type=json", "-p", json.dumps(patch_rbac)]
subprocess.run(cmd_rbac, check=True)

print("✅ ArgoCD ConfigMaps updated.")
