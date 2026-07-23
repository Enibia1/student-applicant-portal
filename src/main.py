# main.py - REMADEF Registration System
# Complete production-ready version

from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
import json
from datetime import datetime

def main(context):
    """
    REMADEF User Registration Endpoint
    Supports Email or Phone registration with duplicate checking
    """
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(context.env.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(context.env.get('APPWRITE_PROJECT_ID'))
    client.set_key(context.env.get('APPWRITE_API_KEY'))
    
    users = Users(client)
    
    # Parse request
    try:
        data = context.req.json
        if not data:
            return error_response(context, 'Missing request body', 400)
    except:
        return error_response(context, 'Invalid JSON payload', 400)
    
    # Extract fields
    email = data.get('email', '').strip() or None
    phone = data.get('phone', '').strip() or None
    password = data.get('password', '')
    method = data.get('method', 'email')
    
    # Optional fields for extended profile
    full_name = data.get('full_name', '').strip() or None
    state = data.get('state', '').strip() or None
    category = data.get('category', '')  # SSS, Undergraduate, NYSC, Alumni
    referred_by = data.get('referred_by', '').strip() or None
    
    context.log(f"📝 Registration attempt - Method: {method}, Email: {email}, Phone: {phone}")
    
    # ============================================================
    # ✅ VALIDATION PHASE
    # ============================================================
    
    # 1. Validate based on method
    if method == 'email':
        if not email:
            return error_response(context, 'Email address is required', 400)
        if not is_valid_email(email):
            return error_response(context, 'Please enter a valid email address', 400)
        phone = None  # Clear phone
    
    elif method == 'phone':
        if not phone:
            return error_response(context, 'Phone number is required', 400)
        phone = normalize_phone(phone)
        if not phone:
            return error_response(context, 'Invalid phone number. Use format: 08012345678', 400)
        email = None  # Clear email
    
    else:
        return error_response(context, 'Invalid registration method. Choose "email" or "phone"', 400)
    
    # 2. Validate password
    password_valid, password_error = validate_password(password)
    if not password_valid:
        return error_response(context, password_error, 400)
    
    # ============================================================
    # ✅ DUPLICATE CHECK PHASE
    # ============================================================
    
    context.log(f"🔍 Checking for duplicates - Email: {email}, Phone: {phone}")
    
    try:
        duplicate_result = check_duplicates(users, email, phone)
        
        if duplicate_result.get('exists'):
            field = duplicate_result.get('field', 'account')
            context.log(f"⚠️ Duplicate found - {field}: {duplicate_result.get('value')}")
            
            return error_response(
                context, 
                f'A user with this {field} already exists. Please login.',
                409
            )
    
    except Exception as e:
        context.error(f"Duplicate check failed: {str(e)}")
        # Continue anyway - Appwrite will catch duplicates during creation
    
    # ============================================================
    # ✅ USER CREATION PHASE
    # ============================================================
    
    try:
        # Prepare user data
        user_data = {
            'userId': 'unique()',
            'password': password,
            'name': full_name or 'Remora Trainee'
        }
        
        # Add email or phone
        if email:
            user_data['email'] = email
        if phone:
            user_data['phone'] = phone
        
        context.log(f"👤 Creating user with: {user_data.get('email') or user_data.get('phone')}")
        
        # Create the user
        new_user = users.create(**user_data)
        
        context.log(f"✅ User created successfully - ID: {new_user['$id']}")
        
        # ============================================================
        # ✅ POST-CREATION PHASE (Extended Profile)
        # ============================================================
        
        # Store additional metadata (if you have a database)
        try:
            # You can add custom attributes to the user
            # For now, we'll log it
            context.log(f"📊 Extended profile - State: {state}, Category: {category}, Referred By: {referred_by}")
            
            # Generate trainee ID (REM-XXX-001 format)
            trainee_id = generate_trainee_id(category)
            context.log(f"🏷️ Generated Trainee ID: {trainee_id}")
            
            # If you have a database, store these:
            # - trainee_id
            # - state
            # - category
            # - referred_by
            # - registration_date: datetime.now()
            # - kinetic_score: 0
            # - referral_slots: 1
            
        except Exception as e:
            context.log(f"⚠️ Metadata storage warning: {str(e)}")
        
        # ============================================================
        # ✅ SUCCESS RESPONSE
        # ============================================================
        
        return success_response(context, {
            'user_id': new_user['$id'],
            'email': new_user.get('email'),
            'phone': new_user.get('phone'),
            'name': new_user.get('name'),
            'registration_date': datetime.now().isoformat(),
            'next_steps': {
                'login': 'Proceed to login with your credentials',
                'application': 'Complete your student application form',
                'profile': 'Update your profile with additional details'
            }
        })
    
    except AppwriteException as e:
        context.error(f"❌ Appwrite error: {str(e)}")
        
        # Handle specific Appwrite errors
        error_msg = str(e).lower()
        
        if 'email already exists' in error_msg:
            return error_response(context, 'This email is already registered. Please login.', 409)
        
        elif 'phone already exists' in error_msg:
            return error_response(context, 'This phone number is already registered. Please login.', 409)
        
        elif 'invalid password' in error_msg:
            return error_response(context, 'Password does not meet security requirements. Use 8+ chars with uppercase, lowercase, and numbers.', 400)
        
        elif 'invalid email' in error_msg:
            return error_response(context, 'Invalid email format. Please check and try again.', 400)
        
        else:
            context.error(f"Unhandled Appwrite error: {str(e)}")
            return error_response(context, f'Registration failed: {str(e)}', 500)
    
    except Exception as e:
        context.error(f"❌ Unexpected error: {str(e)}")
        return error_response(context, 'An unexpected error occurred. Please try again.', 500)


# ============================================================
# 🔧 HELPER FUNCTIONS
# ============================================================

def is_valid_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def normalize_phone(phone):
    """
    Normalize Nigerian phone numbers
    Examples:
    08037537614 → +2348037537614
    8037537614 → +2348037537614
    +2348037537614 → +2348037537614
    """
    # Remove all non-digits
    clean = re.sub(r'\D', '', phone)
    
    if not clean:
        return None
    
    # Validate length
    if len(clean) < 10 or len(clean) > 14:
        return None
    
    # Nigerian number formats
    if clean.startswith('0') and len(clean) == 11:
        # 08037537614 → +2348037537614
        return '+234' + clean[1:]
    
    elif clean.startswith('234') and len(clean) == 13:
        # 2348037537614 → +2348037537614
        return '+' + clean
    
    elif len(clean) == 10:
        # 8037537614 → +2348037537614
        return '+234' + clean
    
    elif clean.startswith('+234') and len(clean) == 14:
        # +2348037537614 → keep as is
        return clean
    
    else:
        return None


def validate_password(password):
    """
    Validate password strength
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    if not password:
        return False, 'Password is required'
    
    if len(password) < 8:
        return False, 'Password must be at least 8 characters'
    
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain a lowercase letter'
    
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain an uppercase letter'
    
    if not re.search(r'\d', password):
        return False, 'Password must contain a number'
    
    return True, None


def check_duplicates(users, email=None, phone=None):
    """
    Check if user with given email or phone already exists
    Returns: {'exists': bool, 'field': str, 'value': str}
    """
    if not email and not phone:
        return {'exists': False}
    
    try:
        # Get all users (handle pagination)
        all_users = []
        response = users.list()
        all_users.extend(response.get('users', []))
        
        # Handle pagination (Appwrite default limit is 100)
        while response.get('next'):
            try:
                response = users.list(cursor=response.get('next'))
                all_users.extend(response.get('users', []))
            except:
                break  # If pagination fails, continue with what we have
        
        # Check for duplicates
        for user in all_users:
            if email and user.get('email') == email:
                return {
                    'exists': True, 
                    'field': 'email',
                    'value': email
                }
            
            if phone and user.get('phone') == phone:
                return {
                    'exists': True, 
                    'field': 'phone number',
                    'value': phone
                }
        
        return {'exists': False}
    
    except Exception as e:
        # If duplicate check fails, let Appwrite handle it during creation
        print(f"Duplicate check warning: {str(e)}")
        return {'exists': False}


def generate_trainee_id(category):
    """
    Generate trainee ID in format: REM-XXX-001
    Categories: SSS, UG, NYSC, AL
    """
    import random
    import string
    
    # Map category to prefix
    prefix_map = {
        'SSS': 'SSS',
        'Undergraduate': 'UG',
        'NYSC': 'NYSC',
        'Alumni': 'AL',
        '': 'GEN'  # Default
    }
    
    prefix = prefix_map.get(category, 'GEN')
    
    # Generate random 3-digit number
    number = str(random.randint(1, 999)).zfill(3)
    
    return f"REM-{prefix}-{number}"


def error_response(context, message, status=400):
    """Return standardized error response"""
    return context.res.json({
        'success': False,
        'error': message,
        'status': status
    }, status)


def success_response(context, data, message='Account created successfully!'):
    """Return standardized success response"""
    return context.res.json({
        'success': True,
        'message': message,
        'data': data,
        'status': 201
    }, 201)


# ============================================================
# 🔌 OPTIONAL: CHECK USER ENDPOINT
# ============================================================

def check_user(context):
    """
    Endpoint to check if a user exists before registration
    Used by frontend for real-time validation
    """
    try:
        data = context.req.json
        email = data.get('email', '').strip() or None
        phone = data.get('phone', '').strip() or None
        
        if not email and not phone:
            return context.res.json({
                'exists': False,
                'error': 'Email or phone required'
            }, 400)
        
        # Initialize client
        client = Client()
        client.set_endpoint(context.env.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(context.env.get('APPWRITE_PROJECT_ID'))
        client.set_key(context.env.get('APPWRITE_API_KEY'))
        
        users = Users(client)
        result = check_duplicates(users, email, phone)
        
        return context.res.json({
            'exists': result.get('exists', False),
            'field': result.get('field'),
            'value': result.get('value')
        })
        
    except Exception as e:
        context.error(f"Check user failed: {str(e)}")
        return context.res.json({
            'exists': False,
            'error': str(e)
        }, 500)
