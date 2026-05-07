import subprocess
cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "master@192.168.122.220", "echo master | sudo -S kubectl --kubeconfig /etc/kubernetes/admin.conf get rolebinding -A"]
result = subprocess.run(cmd, capture_output=True, text=True)
for line in result.stdout.split('\n'):
    if 'ben-nasr' in line:
        print(line)
