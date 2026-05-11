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

# Fix: Add 192.168.122.200 as secondary IP on master enp1s0
# This makes libvirt allow ARP responses for this IP from the VM
print("Adding 192.168.122.200 as secondary IP on master enp1s0...")
result = ssh_sudo("192.168.122.220",
    "ip addr show enp1s0 | grep -q 192.168.122.200 || ip addr add 192.168.122.200/24 dev enp1s0 && echo ADDED || echo ALREADY_EXISTS")
print("Add IP result:", result[-300:])

print("\nVerifying IP is set...")
result = ssh_sudo("192.168.122.220", "ip addr show enp1s0 | grep 192.168.122")
print("Interface IPs:", result[-300:])

# Also make it persistent across reboots
print("\nMaking persistent via /etc/rc.local...")
rc_cmd = """grep -q '192.168.122.200' /etc/rc.local 2>/dev/null || 
cat >> /etc/rc.local << 'EOF'
ip addr add 192.168.122.200/24 dev enp1s0 2>/dev/null || true
EOF
chmod +x /etc/rc.local && echo PERSISTED"""
result = ssh_sudo("192.168.122.220", rc_cmd)
print("Persist result:", result[-200:])
