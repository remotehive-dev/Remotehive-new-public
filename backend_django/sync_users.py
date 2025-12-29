import os
import requests
import django
import dotenv
from pathlib import Path

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

# Clerk Configuration
CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")
CLERK_API_URL = "https://api.clerk.com/v1/users"

if not CLERK_SECRET_KEY:
    print("Warning: CLERK_SECRET_KEY not found in environment variables.")

def sync_clerk_users():
    if __name__ == "__main__":
        # Setup Django Environment only if running as script
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'remotehive_admin.settings')
        django.setup()

    from django.contrib.auth import get_user_model
    from core.models import UserProfile

    User = get_user_model()
    
    print("Fetching users from Clerk...")
    headers = {
        'Authorization': f'Bearer {CLERK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Fetch users from Clerk API
        response = requests.get(CLERK_API_URL, headers=headers)
        
        if response.status_code != 200:
            print(f"Error fetching users: {response.status_code} - {response.text}")
            return

        clerk_users = response.json()
        print(f"Found {len(clerk_users)} users in Clerk.")
        
        for c_user in clerk_users:
            # Clerk user object structure:
            # {
            #   "id": "user_...",
            #   "email_addresses": [{"email_address": "..."}],
            #   "public_metadata": {"role": "employer"},
            #   "first_name": "...", "last_name": "..."
            # }
            
            # Get primary email
            email_addresses = c_user.get('email_addresses', [])
            if not email_addresses:
                print(f"Skipping user {c_user.get('id')} - No email found.")
                continue
                
            email = email_addresses[0].get('email_address')
            first_name = c_user.get('first_name') or ""
            last_name = c_user.get('last_name') or ""
            
            # Determine Role
            # Check public_metadata first, then unsafe_metadata
            public_meta = c_user.get('public_metadata', {})
            unsafe_meta = c_user.get('unsafe_metadata', {})
            
            # Look for 'role', 'userType', 'type' keys
            raw_role = (
                public_meta.get('role') or 
                public_meta.get('userType') or 
                unsafe_meta.get('role') or 
                unsafe_meta.get('userType') or 
                'jobseeker'
            )
            
            raw_role = str(raw_role).lower()
            
            # --- MANUAL OVERRIDE FOR KNOWN USERS (Temporary Fix) ---
            if email == "remotehive.official@gmail.com":
                raw_role = "employer"
            # -------------------------------------------------------

            if 'employer' in raw_role:
                django_role = 'employer'
            elif 'admin' in raw_role:
                django_role = 'admin'
            else:
                django_role = 'jobseeker'

            # Determine Auth Provider
            auth_provider = 'email'
            
            # Check external accounts (OAuth)
            external_accounts = c_user.get('external_accounts', [])
            if external_accounts:
                provider_raw = external_accounts[0].get('provider', '')
                if 'google' in provider_raw:
                    auth_provider = 'Google'
                elif 'linkedin' in provider_raw:
                    auth_provider = 'LinkedIn'
                elif 'github' in provider_raw:
                    auth_provider = 'GitHub'
                else:
                    auth_provider = provider_raw
            else:
                # Check email verification strategy
                for email_obj in email_addresses:
                    verification = email_obj.get('verification', {})
                    strategy = verification.get('strategy', '')
                    if 'oauth_google' in strategy:
                        auth_provider = 'Google'
                        break
                    elif 'oauth_linkedin' in strategy:
                        auth_provider = 'LinkedIn'
                        break

            # Create or Update in Django
            try:
                # We use email as username
                user, created = User.objects.update_or_create(
                    username=email,
                    defaults={
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'is_active': True,
                        'is_staff': False, # Keep them out of admin unless explicitly promoted locally
                        'is_superuser': False
                    }
                )
                
                if created:
                    user.set_unusable_password()
                    user.save()
                    print(f"Created local user for: {email} ({django_role})")
                
                # Update Profile
                profile, p_created = UserProfile.objects.get_or_create(user=user)
                
                # Update Clerk specific fields
                profile.clerk_id = c_user.get('id')
                profile.auth_provider = auth_provider
                
                # Only update role if it changed or is new
                if profile.role != django_role:
                    profile.role = django_role
                    print(f"Updated role for {email} to {django_role}")
                
                profile.save()
                
            except Exception as e:
                print(f"Error syncing user {email}: {e}")

    except Exception as e:
        print(f"Major Error fetching from Clerk: {e}")

if __name__ == "__main__":
    sync_clerk_users()
