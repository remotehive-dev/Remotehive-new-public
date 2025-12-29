import os
import requests
import json

# Hardcoded Clerk Secret Key
CLERK_SECRET_KEY = "sk_test_9RIOwNRJQLvIeT1J6j9NQsmeoGZrRDlUD7bxcJji4l"
CLERK_API_URL = "https://api.clerk.com/v1/users?limit=1"

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
