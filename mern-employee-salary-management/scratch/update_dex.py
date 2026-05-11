import pty, os, time

def ssh_run(host, command, user="master", password="master", sudo_password="master"):
    """Run a command on a remote VM via SSH with password auth, handling sudo"""
    full_cmd = f"echo '{sudo_password}' | sudo -S sh -c \"{command}\""
    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=no", f"{user}@{host}", full_cmd]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(cmd[0], cmd)
    else:
        output = ""
        while True:
            try:
                data = os.read(fd, 4096).decode('utf-8', errors='replace')
                output += data
                if "password" in data.lower() and "sudo" not in data.lower():
                    time.sleep(0.3)
                    os.write(fd, (password + "\n").encode())
            except OSError:
                break
        os.waitpid(pid, 0)
        return output

# ── 1. Update Dex config on Dex VM ──────────────────────────────────────────
print("=" * 60)
print("STEP: Updating Dex config on 192.168.122.23")
print("=" * 60)

new_dex_config = """issuer: https://192.168.122.23:5556
storage:
  type: sqlite3
  config:
    file: /var/lib/dex/dex.db
web:
  https: 0.0.0.0:5556
  tlsCert: /etc/dex/certs/dex.crt
  tlsKey: /etc/dex/certs/dex.key
oauth2:
  skipApprovalScreen: true
  enablePasswordDB: false
staticClients:
- id: kubernetes_oidc
  secret: kubernetes-client-secret
  public: true
  redirectURIs:
  - 'https://192.168.122.220:6443/callback'
  - 'http://127.0.0.1:8000/callback'
  - 'http://localhost:8000/callback'
  - 'http://localhost:8000'
  - 'https://dashboard.abir.local/oauth/callback'
  - 'https://dashboard.abir.local/oauth2/callback'
  name: Kubernetes
- id: argocd
  secret: argocd-secret-dex
  public: false
  redirectURIs:
  - 'https://192.168.122.220:32237/auth/callback'
  - 'https://argocd.abir.local/auth/callback'
  name: ArgoCD
connectors:
- type: oidc
  id: keycloak
  name: Keycloak
  config:
    issuer: https://192.168.122.235:8443/realms/kubernetes
    clientID: kubernetes_oidc
    clientSecret: yC1ClZ4woewVKQ8aLiJJM6AI20UxnBm7
    redirectURI: https://192.168.122.23:5556/callback
    rootCAs: [/etc/dex/keycloak.crt]
    insecureSkipEmailVerified: true
    scopes:
      - openid
      - profile
      - email
      - groups
    insecureEnableGroups: true
    userNameKey: preferred_username
    userIDKey: preferred_username
    groupsClaim: groups
"""

# Write the new config via heredoc
write_cmd = f"cat > /etc/dex/config.yaml << 'DEXEOF'\n{new_dex_config}\nDEXEOF"
result = ssh_run("192.168.122.23", write_cmd)
print("Write result:", result[-200:] if len(result) > 200 else result)

# Restart Dex
print("Restarting Dex service...")
result = ssh_run("192.168.122.23", "systemctl restart dex && sleep 2 && systemctl status dex --no-pager | head -5")
print("Restart result:", result[-400:] if len(result) > 400 else result)

print("\nDex VM update DONE")
