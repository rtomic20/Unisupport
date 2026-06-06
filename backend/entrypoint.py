import subprocess
import sys

def run(cmd, check=True):
    result = subprocess.run(cmd, check=check)
    return result.returncode == 0

if __name__ == "__main__":
    print("Running migrations...")
    run(["python", "manage.py", "migrate", "--noinput"])

    print("Seeding initial data...")
    run(["python", "manage.py", "seed_initial_data"], check=False)

    print("Starting Django development server...")
    run(["python", "manage.py", "runserver", "0.0.0.0:8000"])
