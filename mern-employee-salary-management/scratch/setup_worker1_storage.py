import pty, os, time

def ssh_sudo(host, command, user="master", ssh_pass="master", sudo_pass="master"):
    full_cmd = f"echo '{sudo_pass}' | sudo -S sh -c \"{command}\""
    cmd = ["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", full_cmd]
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
                    time.sleep(0.2)
                    os.write(fd, (ssh_pass + "\n").encode())
            except OSError:
                break
        os.waitpid(pid, 0)
        return output

print("=== Creating /data/mysql on worker1 ===")
result = ssh_sudo("192.168.122.148",
    "mkdir -p /data/mysql && chmod 777 /data/mysql && echo OK",
    user="master", ssh_pass="master", sudo_pass="master")
print(result[-200:])

print("\n=== Verifying directory ===")
result = ssh_sudo("192.168.122.148",
    "ls -la /data/",
    user="master", ssh_pass="master", sudo_pass="master")
print(result[-200:])
