import pty
import os
import sys
import time

cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "master@192.168.122.23", "echo 'SUCCESS'"]
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
    print("OUTPUT:", output)
