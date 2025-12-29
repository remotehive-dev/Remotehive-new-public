import os
import requests
import json
import dotenv
from pathlib import Path

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

# Clerk Configuration
CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")
CLERK_API_URL = "https://api.clerk.com/v1/users?limit=1"

if not CLERK_SECRET_KEY:
    print("Warning: CLERK_SECRET_KEY not found in environment variables.")

def inspect_clerk_user():
    print("Fetching 1 user from Clerk to inspect metadata...")
    headers = {
        'Authorization': f'Bearer {CLERK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(CLERK_API_URL, headers=headers)
        if response.status_code != 200:
            print(f"Error: {response.status_code} - {response.text}")
            return

        users = response.json()
        if not users:
            print("No users found.")
            return

        user = users[0]
        print("\n--- RAW USER DATA ---")
        print(json.dumps(user, indent=2))
        print("\n---------------------")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_clerk_user()
