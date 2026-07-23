# src/main.py - REMADEF Registration with CORS
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
import random
from datetime import datetime

def main(context):
    # ============================================================
    # CORS HEADERS - Allow GitHub Pages
    # ============================================================
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    }
    
    # Handle preflight OPTIONS request
    if context.req.method == 'OPTIONS':
        return context.res.json(
            {'message': 'CORS preflight OK'}, 
            200, 
            cors_headers
        )
    
    # Initialize Appwrite
    client = Client()
    client.set_endpoint('https://cloud.appwrite.io/v1')
    client.set_project(context.env.get('APPWRITE_PROJECT_ID'))
    client.set_key(context.env.get('APPWRITE_API_KEY'))
    users = Users(client)
    
    # Parse request
    try:
        data = context.req.json
        if not data:
            return context.res.json({
                'success': False,
                'error': 'Missing request body'
            }, 400, cors_headers)
    except:
        return context.res.json({
            'success': False,
            'error': 'Invalid JSON payload'
        }, 400, cors_headers)
    
    # Extract fields
    email = data.get('email', '').strip() or None
    phone = data.get('phone', '').strip() or None
    password = data.get('password', '')
    method = data.get('method', 'email')
    
    context.log(f"📝 Registration - Method: {method}")
    
    # ============================================================
    # VALIDATION
    # ============================================================
    
    if method == 'email':
        if not email:
            return context.res.json({
                'success': False,
                'error': 'Email address is required'
            }, 400, cors_headers)
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return context.res.json({
                'success': False,
                'error': 'Please enter a valid email address'
            }, 400, cors_headers)
        phone = None
    elif method == 'phone':
        if not phone:
            return context.res.json({
                'success': False,
                'error': 'Phone number is required'
            }, 400, cors_headers)
        # Clean phone
        clean = re.sub(r'\D', '', phone)
        if clean.startswith('0') and len(clean) == 11:
            phone = '+234' + clean[1:]
        elif len(clean) == 10:
            phone = '+234' + clean
        elif clean.startswith('234') and len(clean) == 13:
            phone = '+' + clean
        elif clean.startswith('+234') and len(clean) == 14:
            phone = clean
        else:
            return context.res.json({
                'success': False,
                'error': 'Invalid phone number. Use 08012345678'
            }, 400, cors_headers)
        email = None
    else:
        return context.res.json({
            'success': False,
            'error': 'Invalid registration method'
        }, 400, cors_headers)
    
    # Validate password
    if not password:
        return context.res.json({
            'success': False,
            'error': 'Password is required'
        }, 400, cors_headers)
    if len(password) < 8:
        return context.res.json({
            'success': False,
            'error': 'Password must be at least 8 characters'
        }, 400, cors_headers)
    if not re.search(r'[a-z]', password):
        return context.res.json({
            'success': False,
            'error': 'Password must contain a lowercase letter'
        }, 400, cors_headers)
    if not re.search(r'[A-Z]', password):
        return context.res.json({
            'success': False,
            'error': 'Password must contain an uppercase letter'
        }, 400, cors_headers)
    if not re.search(r'\d', password):
        return context.res.json({
            'success': False,
            'error': 'Password must contain a number'
        }, 400, cors_headers)
    
    # ============================================================
    # CHECK DUPLICATES
    # ============================================================
    
    try:
        # Check if user exists
        all_users = []
        response = users.list()
        all_users.extend(response.get('users', []))
        
        while response.get('next'):
            response = users.list(cursor=response.get('next'))
            all_users.extend(response.get('users', []))
        
        for user in all_users:
            if email and user.get('email') == email:
                return context.res.json({
                    'success': False,
                    'error': 'This email is already registered. Please login.'
                }, 409, cors_headers)
            if phone and user.get('phone') == phone:
                return context.res.json({
                    'success': False,
                    'error': 'This phone number is already registered. Please login.'
                }, 409, cors_headers)
    except Exception as e:
        context.error(f"Duplicate check warning: {str(e)}")
    
    # ============================================================
    # CREATE USER
    # ============================================================
    
    try:
        user_data = {
            'userId': 'unique()',
            'password': password,
            'name': 'Remora Trainee'
        }
        if email:
            user_data['email'] = email
        if phone:
            user_data['phone'] = phone
        
        new_user = users.create(**user_data)
        
        context.log(f"✅ User created: {new_user['$id']}")
        
        # Generate trainee ID
        trainee_id = f"REM-{str(random.randint(1, 9999)).zfill(4)}"
        
        return context.res.json({
            'success': True,
            'message': 'Account created successfully!',
            'data': {
                'user_id': new_user['$id'],
                'email': new_user.get('email'),
                'phone': new_user.get('phone'),
                'name': new_user.get('name'),
                'trainee_id': trainee_id,
                'registration_date': datetime.now().isoformat()
            }
        }, 201, cors_headers)
    
    except AppwriteException as e:
        context.error(f"❌ Appwrite error: {str(e)}")
        error_msg = str(e).lower()
        
        if 'email already exists' in error_msg:
            return context.res.json({
                'success': False,
                'error': 'This email is already registered'
            }, 409, cors_headers)
        elif 'phone already exists' in error_msg:
            return context.res.json({
                'success': False,
                'error': 'This phone number is already registered'
            }, 409, cors_headers)
        else:
            return context.res.json({
                'success': False,
                'error': f'Registration failed: {str(e)}'
            }, 500, cors_headers)
    
    except Exception as e:
        context.error(f"❌ Unexpected error: {str(e)}")
        return context.res.json({
            'success': False,
            'error': 'An unexpected error occurred. Please try again.'
        }, 500, cors_headers)
