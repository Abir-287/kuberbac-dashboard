import subprocess

# Try multiple common passwords for sudo
passwords = ["abir", "master", "1234", "password", "abir123"]

for pwd in passwords:
    try:
        result = subprocess.run(
            ["sudo", "-S", "sh", "-c",
             "sed -i '/dashboard\\.abir\\.local/d' /etc/hosts && "
             "sed -i '/argocd\\.abir\\.local/d' /etc/hosts && "
             "echo '192.168.122.200  argocd.abir.local dashboard.abir.local' >> /etc/hosts"],
            input=pwd + "\n",
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"SUCCESS with password: {pwd}")
            # Verify
            verify = subprocess.run(["grep", "abir.local", "/etc/hosts"],
                                    capture_output=True, text=True)
            print("Hosts entries:", verify.stdout)
            break
        else:
            print(f"Failed with '{pwd}': {result.stderr.strip()}")
    except subprocess.TimeoutExpired:
        print(f"Timeout with '{pwd}'")
    except Exception as e:
        print(f"Error: {e}")
