import pty, os, time

def sudo_run(command, password="abir"):
    """Run a sudo command on the local machine via pty"""
    cmd = ["sudo", "sh", "-c", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(cmd[0], cmd)
    else:
        output = ""
        while True:
            try:
                data = os.read(fd, 4096).decode('utf-8', errors='replace')
                output += data
                if "password" in data.lower() and "sudo" in data.lower():
                    time.sleep(0.3)
                    os.write(fd, (password + "\n").encode())
            except OSError:
                break
        os.waitpid(pid, 0)
        return output

# Update /etc/hosts - remove stale entries and add correct one
print("Updating /etc/hosts...")

# Remove any old abir.local entries
result = sudo_run("sed -i '/argocd\\.abir\\.local/d' /etc/hosts && sed -i '/dashboard\\.abir\\.local/d' /etc/hosts")
print("Removed old entries:", repr(result))

# Add the correct entry
result = sudo_run("echo '192.168.122.200  argocd.abir.local dashboard.abir.local' >> /etc/hosts")
print("Added new entry:", repr(result))

# Verify
result = sudo_run("grep 'abir.local' /etc/hosts")
print("Current entries:", repr(result))
