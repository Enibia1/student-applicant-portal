# src/main.py - REMADEF Registration System
# Updated: Removed full name requirement

from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
from datetime import datetime

def main(context):
    """
    REMADEF User Registration Endpoint
    Creates user account with email OR phone
    """
    
    # Initialize Appwrite
    client = Client()
    client.set_endpoint(context.env.get('APPWRITE_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(context.env.get('APPWRITE_PROJECT_ID'))
    client.set_key(context.env.get('APPWRITE_API_KEY'))
    
    users = Users(client)
    
    # Get request data
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
    # Full name is optional - will be set in profile edit
    full_name = data.get('full_name', '').strip() or 'Remora Trainee'
    
    context.log(f"📝 Registration - Method: {method}, Email: {email}, Phone: {phone}")
    
    # ============================================================
    # VALIDATION
    # ============================================================
    
    # Validate based on method
    if method == 'email':
        if not email:
            return error_response(context, 'Email address is required', 400)
        if not is_valid_email(email):
            return error_response(context, 'Please enter a valid email address', 400)
        phone = None
    
    elif method == 'phone':
        if not phone:
            return error_response(context, 'Phone number is required', 400)
        phone = normalize_phone(phone)
        if not phone:
            return error_response(context, 'Invalid phone number. Use 08012345678', 400)
        email = None
    
    else:
        return error_response(context, 'Invalid registration method', 400)
    
    # Validate password
    password_valid, password_error = validate_password(password)
    if not password_valid:
        return error_response(context, password_error, 400)
    
    # ============================================================
    # DUPLICATE CHECK
    # ============================================================
    
    context.log(f"🔍 Checking duplicates - Email: {email}, Phone: {phone}")
    
    try:
        duplicate = check_duplicates(users, email, phone)
        if duplicate.get('exists'):
            field = duplicate.get('field', 'account')
            return error_response(
                context, 
                f'A user with this {field} already exists. Please login.',
                409
            )
    except Exception as e:
        context.error(f"Duplicate check warning: {str(e)}")
    
    # ============================================================
    # CREATE USER
    # ============================================================
    
    try:
        user_data = {
            'userId': 'unique()',
            'password': password,
            'name': full_name
        }
        
        if email:
            user_data['email'] = email
        if phone:
            user_data['phone'] = phone
        
        new_user = users.create(**user_data)
        
        context.log(f"✅ User created: {new_user['$id']}")
        
        # Generate trainee ID
        trainee_id = generate_trainee_id()
        
        return success_response(context, {
            'user_id': new_user['$id'],
            'email': new_user.get('email'),
            'phone': new_user.get('phone'),
            'name': new_user.get('name'),
            'trainee_id': trainee_id,
            'registration_date': datetime.now().isoformat()
        })
    
    except AppwriteException as e:
        context.error(f"❌ Appwrite error: {str(e)}")
        error_msg = str(e).lower()
        
        if 'email already exists' in error_msg:
            return error_response(context, 'This email is already registered', 409)
        elif 'phone already exists' in error_msg:
            return error_response(context, 'This phone number is already registered', 409)
        else:
            return error_response(context, f'Registration failed: {str(e)}', 500)
    
    except Exception as e:
        context.error(f"❌ Unexpected error: {str(e)}")
        return error_response(context, 'An unexpected error occurred. Please try again.', 500)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def is_valid_email(email):
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def normalize_phone(phone):
    clean = re.sub(r'\D', '', phone)
    if not clean or len(clean) < 10:
        return None
    
    if clean.startswith('0') and len(clean) == 11:
        return '+234' + clean[1:]
    elif clean.startswith('234') and len(clean) == 13:
        return '+' + clean
    elif len(clean) == 10:
        return '+234' + clean
    elif clean.startswith('+234') and len(clean) == 14:
        return clean
    else:
        return None


def validate_password(password):
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
    if not email and not phone:
        return {'exists': False}
    
    try:
        all_users = []
        response = users.list()
        all_users.extend(response.get('users', []))
        
        while response.get('next'):
            response = users.list(cursor=response.get('next'))
            all_users.extend(response.get('users', []))
        
        for user in all_users:
            if email and user.get('email') == email:
                return {'exists': True, 'field': 'email'}
            if phone and user.get('phone') == phone:
                return {'exists': True, 'field': 'phone number'}
        
        return {'exists': False}
    except:
        return {'exists': False}


def generate_trainee_id():
    import random
    number = str(random.randint(1, 9999)).zfill(4)
    return f"REM-{number}"


def error_response(context, message, status=400):
    return context.res.json({
        'success': False,
        'error': message,
        'status': status
    }, status)


def success_response(context, data, message='Account created successfully!'):
    return context.res.json({
        'success': True,
        'message': message,
        'data': data,
        'status': 201
    }, 201)
