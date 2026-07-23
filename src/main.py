# src/main.py - REMADEF Registration (SIMPLIFIED)
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
import random
import json

def main(context):
    # ============================================================
    # CORS HEADERS
    # ============================================================
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    # Handle OPTIONS preflight
    if context.req.method == 'OPTIONS':
        return context.res.json(
            {'message': 'CORS OK'}, 
            200, 
            cors_headers
        )
    
    try:
        # ============================================================
        # GET REQUEST BODY
        # ============================================================
        
        # Get raw body
        body = context.req.body
        
        # If no body, return error
        if not body:
            return context.res.json({
                'success': False,
                'error': 'Missing request body'
            }, 400, cors_headers)
        
        # Parse JSON
        try:
            data = json.loads(body)
        except:
            return context.res.json({
                'success': False,
                'error': 'Invalid JSON'
            }, 400, cors_headers)
        
        # Get fields
        method = data.get('method', 'email')
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        password = data.get('password', '')
        
        # ============================================================
        # VALIDATION
        # ============================================================
        
        # Check method
        if method not in ['email', 'phone']:
            return context.res.json({
                'success': False,
                'error': 'Invalid method'
            }, 400, cors_headers)
        
        # Check email
        if method == 'email':
            if not email:
                return context.res.json({
                    'success': False,
                    'error': 'Email is required'
                }, 400, cors_headers)
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                return context.res.json({
                    'success': False,
                    'error': 'Invalid email'
                }, 400, cors_headers)
            phone = None
        else:
            # Check phone
            if not phone:
                return context.res.json({
                    'success': False,
                    'error': 'Phone is required'
                }, 400, cors_headers)
            # Clean phone
            clean = re.sub(r'\D', '', phone)
            if len(clean) == 10:
                phone = '+234' + clean
            elif len(clean) == 11 and clean.startswith('0'):
                phone = '+234' + clean[1:]
            else:
                return context.res.json({
                    'success': False,
                    'error': 'Invalid phone number'
                }, 400, cors_headers)
            email = None
        
        # Check password
        if not password:
            return context.res.json({
                'success': False,
                'error': 'Password is required'
            }, 400, cors_headers)
        if len(password) < 8:
            return context.res.json({
                'success': False,
                'error': 'Password must be 8+ characters'
            }, 400, cors_headers)
        
        # ============================================================
        # INITIALIZE APPUTE
        # ============================================================
        
        # Get API key from request (Scopes)
        api_key = context.req.headers.get('x-appwrite-key')
        
        if not api_key:
            return context.res.json({
                'success': False,
                'error': 'Missing API key - add Scopes'
            }, 500, cors_headers)
        
        # Initialize client
        client = Client()
        client.set_endpoint('https://cloud.appwrite.io/v1')
        client.set_project('6a5bc178003a2529271e')  # Your Project ID
        client.set_key(api_key)
        users = Users(client)
        
        # ============================================================
        # CREATE USER
        # ============================================================
        
        try:
            # Prepare user data
            user_data = {
                'user_id': 'unique()',
                'password': password,
                'name': 'Remora Trainee'
            }
            if email:
                user_data['email'] = email
            if phone:
                user_data['phone'] = phone
            
            # Create user
            new_user = users.create(**user_data)
            
            # Generate trainee ID
            trainee_id = f"REM-{str(random.randint(1, 9999)).zfill(4)}"
            
            # Return success
            return context.res.json({
                'success': True,
                'message': 'Account created successfully!',
                'data': {
                    'user_id': new_user.get('$id'),
                    'email': new_user.get('email'),
                    'phone': new_user.get('phone'),
                    'name': new_user.get('name'),
                    'trainee_id': trainee_id
                }
            }, 201, cors_headers)
            
        except AppwriteException as e:
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
            return context.res.json({
                'success': False,
                'error': f'Error: {str(e)}'
            }, 500, cors_headers)
            
    except Exception as e:
        return context.res.json({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, 500, cors_headers)
