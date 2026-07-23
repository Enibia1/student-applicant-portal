# src/main.py - REMADEF Registration (FIXED - Using os.environ)
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import re
import random
import json
import os

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
        
        body = context.req.body
        if not body:
            return context.res.json({
                'success': False,
                'error': 'Missing request body'
            }, 400, cors_headers)
        
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return context.res.json({
                'success': False,
                'error': 'Invalid JSON payload'
            }, 400, cors_headers)
        
        context.log(f"📝 Received: {json.dumps(data)}")
        
        method = data.get('method', 'email')
        password = data.get('password', '')
        email = data.get('email', '').strip() or None
        phone = data.get('phone', '').strip() or None
        
        # ============================================================
        # VALIDATION
        # ============================================================
        
        if method not in ['email', 'phone']:
            return context.res.json({
                'success': False,
                'error': 'Invalid method. Use "email" or "phone"'
            }, 400, cors_headers)
        
        if method == 'email':
            if not email:
                return context.res.json({
                    'success': False,
                    'error': 'Email is required'
                }, 400, cors_headers)
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                return context.res.json({
                    'success': False,
                    'error': 'Invalid email format'
                }, 400, cors_headers)
            phone = None
        
        if method == 'phone':
            if not phone:
                return context.res.json({
                    'success': False,
                    'error': 'Phone is required'
                }, 400, cors_headers)
            
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
                'error': 'Password needs a lowercase letter'
            }, 400, cors_headers)
        if not re.search(r'[A-Z]', password):
            return context.res.json({
                'success': False,
                'error': 'Password needs an uppercase letter'
            }, 400, cors_headers)
        if not re.search(r'\d', password):
            return context.res.json({
                'success': False,
                'error': 'Password needs a number'
            }, 400, cors_headers)
        
        # ============================================================
        # GET CREDENTIALS - FIXED using os.environ
        # ============================================================
        
        project_id = os.environ.get('APPWRITE_PROJECT_ID')
        api_key = os.environ.get('APPWRITE_API_KEY')
        
        context.log(f"🔑 Project ID: {project_id[:10] if project_id else 'None'}...")
        
        if not project_id or not api_key:
            context.error("❌ Missing environment variables")
            return context.res.json({
                'success': False,
                'error': 'Server configuration error: Missing credentials'
            }, 500, cors_headers)
        
        # ============================================================
        # INITIALIZE APPUTE
        # ============================================================
        
        try:
            client = Client()
            client.set_endpoint('https://cloud.appwrite.io/v1')
            client.set_project(project_id)
            client.set_key(api_key)
            users = Users(client)
            
            context.log("✅ Appwrite client initialized")
        except Exception as e:
            context.error(f"❌ Appwrite init failed: {str(e)}")
            return context.res.json({
                'success': False,
                'error': f'Server configuration error: {str(e)}'
            }, 500, cors_headers)
        
        # ============================================================
        # CHECK DUPLICATES
        # ============================================================
        
        try:
            user_list = users.list(limit=100)
            for user in user_list.get('users', []):
                if email and user.get('email') == email:
                    return context.res.json({
                        'success': False,
                        'error': 'This email is already registered'
                    }, 409, cors_headers)
                if phone and user.get('phone') == phone:
                    return context.res.json({
                        'success': False,
                        'error': 'This phone number is already registered'
                    }, 409, cors_headers)
        except Exception as e:
            context.error(f"⚠️ Duplicate check warning: {str(e)}")
        
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
            
            context.log(f"📝 Creating user...")
            
            new_user = users.create(**user_data)
            
            context.log(f"✅ User created: {new_user.get('$id')}")
            
            trainee_id = f"REM-{str(random.randint(1, 9999)).zfill(4)}"
            
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
            context.error(f"❌ Appwrite error: {error_msg}")
            
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
                'error': f'Unexpected error: {str(e)}'
            }, 500, cors_headers)
            
    except Exception as e:
        context.error(f"❌ Top-level error: {str(e)}")
        return context.res.json({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, 500, cors_headers)
