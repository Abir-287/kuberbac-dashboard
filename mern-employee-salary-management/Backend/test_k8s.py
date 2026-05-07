import pty
import os

cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "master@192.168.122.220", "echo master | sudo -S kubectl --kubeconfig /etc/kubernetes/admin.conf get rolebindings -A"]
pid, fd = pty.fork()

if pid == 0:
    os.execvp(cmd[0], cmd)
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
    for line in output.split('\n'):
        if 'ben-nasr' in line:
            print("FOUND:", line)
