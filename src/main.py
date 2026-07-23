from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
from datetime import datetime

def main(context):
    # CORS Headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Handle OPTIONS preflight
    if context.req.method == 'OPTIONS':
        return context.res.json({'message': 'OK'}, 200, headers)
    
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
            }, 400, headers)
    except:
        return context.res.json({
            'success': False,
            'error': 'Invalid JSON'
        }, 400, headers)
    
    # Get fields
    email = data.get('email', '').strip() or None
    phone = data.get('phone', '').strip() or None
    password = data.get('password', '')
    method = data.get('method', 'email')
    
    # Validation
    if method == 'email':
        if not email:
            return context.res.json({
                'success': False,
                'error': 'Email is required'
            }, 400, headers)
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return context.res.json({
                'success': False,
                'error': 'Invalid email'
            }, 400, headers)
        phone = None
    else:
        if not phone:
            return context.res.json({
                'success': False,
                'error': 'Phone is required'
            }, 400, headers)
        # Clean phone
        clean = re.sub(r'\D', '', phone)
        if clean.startswith('0') and len(clean) == 11:
            phone = '+234' + clean[1:]
        elif len(clean) == 10:
            phone = '+234' + clean
        elif clean.startswith('234') and len(clean) == 13:
            phone = '+' + clean
        else:
            return context.res.json({
                'success': False,
                'error': 'Invalid phone number'
            }, 400, headers)
        email = None
    
    # Validate password
    if not password or len(password) < 8:
        return context.res.json({
            'success': False,
            'error': 'Password must be at least 8 characters'
        }, 400, headers)
    if not re.search(r'[a-z]', password):
        return context.res.json({
            'success': False,
            'error': 'Password needs lowercase'
        }, 400, headers)
    if not re.search(r'[A-Z]', password):
        return context.res.json({
            'success': False,
            'error': 'Password needs uppercase'
        }, 400, headers)
    if not re.search(r'\d', password):
        return context.res.json({
            'success': False,
            'error': 'Password needs a number'
        }, 400, headers)
    
    # Create user
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
        
        # Generate trainee ID
        import random
        trainee_id = f"REM-{str(random.randint(1, 9999)).zfill(4)}"
        
        return context.res.json({
            'success': True,
            'message': 'Account created successfully!',
            'data': {
                'user_id': new_user['$id'],
                'email': new_user.get('email'),
                'phone': new_user.get('phone'),
                'trainee_id': trainee_id
            }
        }, 201, headers)
        
    except AppwriteException as e:
        error_msg = str(e).lower()
        if 'email already exists' in error_msg:
            return context.res.json({
                'success': False,
                'error': 'Email already registered'
            }, 409, headers)
        elif 'phone already exists' in error_msg:
            return context.res.json({
                'success': False,
                'error': 'Phone already registered'
            }, 409, headers)
        else:
            return context.res.json({
                'success': False,
                'error': str(e)
            }, 500, headers)
    except Exception as e:
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500, headers)
