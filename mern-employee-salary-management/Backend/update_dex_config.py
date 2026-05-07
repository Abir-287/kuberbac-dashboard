import pty
import os
import sys
import time

new_content = """issuer: https://192.168.122.23:5556
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

with open("temp_dex.yaml", "w") as f:
    f.write(new_content)

# scp
cmd = ["scp", "-o", "StrictHostKeyChecking=no", "temp_dex.yaml", "master@192.168.122.23:/tmp/temp_dex.yaml"]
pid, fd = pty.fork()

if pid == 0:
    os.execvp(cmd[0], cmd)
else:
    output = ""
    while True:
        try:
            data = os.read(fd, 1024).decode('utf-8')
            output += data
            if "password" in data.lower():
                os.write(fd, b"master\n")
        except OSError:
            break

time.sleep(1)

# cp and restart
cmd2 = ["ssh", "-o", "StrictHostKeyChecking=no", "master@192.168.122.23", "echo master | sudo -S cp /tmp/temp_dex.yaml /etc/dex/config.yaml && echo master | sudo -S systemctl restart dex"]
pid, fd = pty.fork()

if pid == 0:
    os.execvp(cmd2[0], cmd2)
else:
    output = ""
    while True:
        try:
            data = os.read(fd, 1024).decode('utf-8')
            output += data
            if "password" in data.lower() and "sudo" not in data.lower():
                os.write(fd, b"master\n")
        except OSError:
            break
    print("SSH OUTPUT:", output)
