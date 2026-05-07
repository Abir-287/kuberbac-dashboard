import pty
import os
import sys
import time

manifest = """
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: developer-access
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services", "endpoints", "persistentvolumeclaims", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "statefulsets", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/portforward"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: viewer-limited
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log", "services"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: namespace-admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
"""

with open("custom_roles.yaml", "w") as f:
    f.write(manifest)

# copy via scp
cmd = ["scp", "-o", "StrictHostKeyChecking=no", "custom_roles.yaml", "master@192.168.122.220:/tmp/custom_roles.yaml"]
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

# apply via ssh
cmd2 = ["ssh", "-o", "StrictHostKeyChecking=no", "master@192.168.122.220", "echo master | sudo -S kubectl --kubeconfig /etc/kubernetes/admin.conf apply -f /tmp/custom_roles.yaml"]
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
    print("OUTPUT:", output)

