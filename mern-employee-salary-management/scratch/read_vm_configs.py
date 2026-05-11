import pty, os, sys, time

def ssh_cmd(host, command, user="master", password="master"):
    """Run a command on a remote VM via SSH with password auth"""
    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", command]
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

# 1. Read kube-apiserver manifest from master
print("=" * 60)
print("KUBE-APISERVER MANIFEST (master VM)")
print("=" * 60)
result = ssh_cmd("192.168.122.220", "echo master | sudo -S cat /etc/kubernetes/manifests/kube-apiserver.yaml 2>/dev/null")
print(result)

# 2. Read Dex config
print("=" * 60)
print("DEX CONFIG (Dex VM)")
print("=" * 60)
result = ssh_cmd("192.168.122.23", "cat /etc/dex/config.yaml 2>/dev/null || cat /home/master/dex/config.yaml 2>/dev/null || find / -name 'config.yaml' -path '*dex*' 2>/dev/null | head -5")
print(result)

# 3. Check Keycloak realm config (via API instead of file)
print("=" * 60)
print("DEX SERVICE STATUS")
print("=" * 60)
result = ssh_cmd("192.168.122.23", "systemctl status dex 2>/dev/null || ps aux | grep dex 2>/dev/null")
print(result)
