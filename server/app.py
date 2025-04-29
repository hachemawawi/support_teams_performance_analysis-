from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import jwt
import datetime
import uuid
import os
import hashlib
from functools import wraps

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
DATABASE = 'support_system.db'
SECRET_KEY = 'your-secret-key'  # Change this in production
TOKEN_EXPIRATION = 24  # hours

# Root route
@app.route('/')
def index():
    return jsonify({
        'message': 'Support System API',
        'status': 'running',
        'version': '1.0.0'
    })

# Database setup
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create requests table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        priority INTEGER NOT NULL DEFAULT 3,
        department TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_to INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (assigned_to) REFERENCES users (id)
    )
    ''')
    
    # Create comments table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        request_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Insert admin user if not exists
    cursor.execute('''
    INSERT OR IGNORE INTO users (first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
    ''', ('Admin', 'User', 'admin@example.com', hash_password('admin123'), 'admin'))
    
    # Insert tech user if not exists
    cursor.execute('''
    INSERT OR IGNORE INTO users (first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
    ''', ('Tech', 'Support', 'tech@example.com', hash_password('tech123'), 'tech'))
    
    # Insert regular user if not exists
    cursor.execute('''
    INSERT OR IGNORE INTO users (first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
    ''', ('Regular', 'User', 'user@example.com', hash_password('user123'), 'user'))
    
    conn.commit()
    conn.close()

# Helper functions
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id, role):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRATION),
        'iat': datetime.datetime.utcnow(),
        'sub': user_id,
        'role': role
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload['sub']
            user_role = payload['role']
            
            conn = get_db_connection()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            
            if not user:
                return jsonify({'message': 'User not found!'}), 401
            
            request.user_id = user_id
            request.user_role = user_role
            
            return f(*args, **kwargs)
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user_role != 'admin':
            return jsonify({'message': 'Admin access required!'}), 403
        return f(*args, **kwargs)
    return decorated

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Check if email already exists
    conn = get_db_connection()
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (data['email'],)).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({'message': 'Email already registered'}), 409
    
    # Insert new user
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO users (first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
    ''', (
        data['firstName'],
        data['lastName'],
        data['email'],
        hash_password(data['password']),
        'user'  # Default role for new registrations
    ))
    
    user_id = cursor.lastrowid
    conn.commit()
    
    # Get the created user
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    # Generate token
    token = generate_token(user_id, 'user')
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'email': user['email'],
            'role': user['role'],
            'createdAt': user['created_at']
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE email = ?', 
        (data['email'],)
    ).fetchone()
    
    if not user or user['password'] != hash_password(data['password']):
        conn.close()
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = generate_token(user['id'], user['role'])
    
    conn.close()
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'email': user['email'],
            'role': user['role'],
            'createdAt': user['created_at']
        }
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (request.user_id,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'firstName': user['first_name'],
        'lastName': user['last_name'],
        'email': user['email'],
        'role': user['role'],
        'createdAt': user['created_at']
    }), 200

# User routes
@app.route('/api/users', methods=['GET'])
@token_required
@admin_required
def get_users():
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users ORDER BY id DESC').fetchall()
    conn.close()
    
    users_list = []
    for user in users:
        users_list.append({
            'id': user['id'],
            'firstName': user['first_name'],
            'lastName': user['last_name'],
            'email': user['email'],
            'role': user['role'],
            'createdAt': user['created_at'],
            'updatedAt': user['updated_at']
        })
    
    return jsonify(users_list), 200

@app.route('/api/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    # Regular users can only access their own data
    if request.user_role != 'admin' and int(request.user_id) != user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'firstName': user['first_name'],
        'lastName': user['last_name'],
        'email': user['email'],
        'role': user['role'],
        'createdAt': user['created_at'],
        'updatedAt': user['updated_at']
    }), 200

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    # Regular users can only update their own data
    if request.user_role != 'admin' and int(request.user_id) != user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build update query dynamically based on provided fields
    update_fields = []
    params = []
    
    if 'firstName' in data:
        update_fields.append('first_name = ?')
        params.append(data['firstName'])
    
    if 'lastName' in data:
        update_fields.append('last_name = ?')
        params.append(data['lastName'])
    
    if 'email' in data:
        update_fields.append('email = ?')
        params.append(data['email'])
    
    if 'password' in data:
        update_fields.append('password = ?')
        params.append(hash_password(data['password']))
    
    # Only admins can update roles
    if 'role' in data and request.user_role == 'admin':
        update_fields.append('role = ?')
        params.append(data['role'])
    
    update_fields.append('updated_at = CURRENT_TIMESTAMP')
    
    if not update_fields:
        conn.close()
        return jsonify({'message': 'No fields to update'}), 400
    
    query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
    params.append(user_id)
    
    cursor.execute(query, params)
    conn.commit()
    
    # Get updated user
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'firstName': user['first_name'],
        'lastName': user['last_name'],
        'email': user['email'],
        'role': user['role'],
        'createdAt': user['created_at'],
        'updatedAt': user['updated_at']
    }), 200

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    
    if not user:
        conn.close()
        return jsonify({'message': 'User not found'}), 404
    
    # Delete user
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'User deleted successfully'}), 200

# Request routes
@app.route('/api/requests', methods=['GET'])
@token_required
def get_requests():
    conn = get_db_connection()
    
    # Admin can see all requests, others see their own
    if request.user_role == 'admin':
        requests = conn.execute('''
            SELECT r.*, 
                   u1.first_name as creator_first_name, u1.last_name as creator_last_name,
                   u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
            FROM requests r
            JOIN users u1 ON r.user_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            ORDER BY r.created_at DESC
        ''').fetchall()
    elif request.user_role == 'tech':
        requests = conn.execute('''
            SELECT r.*, 
                   u1.first_name as creator_first_name, u1.last_name as creator_last_name,
                   u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
            FROM requests r
            JOIN users u1 ON r.user_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE r.assigned_to = ?
            ORDER BY r.created_at DESC
        ''', (request.user_id,)).fetchall()
    else:
        requests = conn.execute('''
            SELECT r.*, 
                   u1.first_name as creator_first_name, u1.last_name as creator_last_name,
                   u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
            FROM requests r
            JOIN users u1 ON r.user_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ''', (request.user_id,)).fetchall()
    
    conn.close()
    
    requests_list = []
    for req in requests:
        requests_list.append({
            'id': req['id'],
            'title': req['title'],
            'description': req['description'],
            'status': req['status'],
            'priority': req['priority'],
            'department': req['department'],
            'userId': req['user_id'],
            'assignedTo': req['assigned_to'],
            'createdAt': req['created_at'],
            'updatedAt': req['updated_at'],
            'user': {
                'firstName': req['creator_first_name'],
                'lastName': req['creator_last_name']
            },
            'assignee': {
                'firstName': req['assignee_first_name'],
                'lastName': req['assignee_last_name']
            } if req['assignee_first_name'] else None
        })
    
    return jsonify(requests_list), 200

@app.route('/api/users/<int:user_id>/requests', methods=['GET'])
@token_required
def get_user_requests(user_id):
    # Regular users can only see their own requests
    if request.user_role != 'admin' and int(request.user_id) != user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    conn = get_db_connection()
    requests = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    requests_list = []
    for req in requests:
        requests_list.append({
            'id': req['id'],
            'title': req['title'],
            'description': req['description'],
            'status': req['status'],
            'priority': req['priority'],
            'department': req['department'],
            'userId': req['user_id'],
            'assignedTo': req['assigned_to'],
            'createdAt': req['created_at'],
            'updatedAt': req['updated_at'],
            'user': {
                'firstName': req['creator_first_name'],
                'lastName': req['creator_last_name']
            },
            'assignee': {
                'firstName': req['assignee_first_name'],
                'lastName': req['assignee_last_name']
            } if req['assignee_first_name'] else None
        })
    
    return jsonify(requests_list), 200

@app.route('/api/requests/assigned/<int:user_id>', methods=['GET'])
@token_required
def get_assigned_requests(user_id):
    # Only admins and the assigned tech can see their assigned requests
    if request.user_role != 'admin' and int(request.user_id) != user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    conn = get_db_connection()
    requests = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        WHERE r.assigned_to = ?
        ORDER BY r.created_at DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    requests_list = []
    for req in requests:
        requests_list.append({
            'id': req['id'],
            'title': req['title'],
            'description': req['description'],
            'status': req['status'],
            'priority': req['priority'],
            'department': req['department'],
            'userId': req['user_id'],
            'assignedTo': req['assigned_to'],
            'createdAt': req['created_at'],
            'updatedAt': req['updated_at'],
            'user': {
                'firstName': req['creator_first_name'],
                'lastName': req['creator_last_name']
            },
            'assignee': {
                'firstName': req['assignee_first_name'],
                'lastName': req['assignee_last_name']
            } if req['assignee_first_name'] else None
        })
    
    return jsonify(requests_list), 200

@app.route('/api/requests/<int:request_id>', methods=['GET'])
@token_required
def get_request(request_id):
    conn = get_db_connection()
    
    # Get request details
    req = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        WHERE r.id = ?
    ''', (request_id,)).fetchone()
    
    if not req:
        conn.close()
        return jsonify({'message': 'Request not found'}), 404
    
    # Check access rights
    if (request.user_role != 'admin' and 
        request.user_role != 'tech' and 
        int(request.user_id) != req['user_id']):
        conn.close()
        return jsonify({'message': 'Access denied'}), 403
    
    # Get comments
    comments = conn.execute('''
        SELECT c.*, u.first_name, u.last_name, u.role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.request_id = ?
        ORDER BY c.created_at ASC
    ''', (request_id,)).fetchall()
    
    comments_list = []
    for comment in comments:
        comments_list.append({
            'id': comment['id'],
            'content': comment['content'],
            'requestId': comment['request_id'],
            'userId': comment['user_id'],
            'createdAt': comment['created_at'],
            'user': {
                'firstName': comment['first_name'],
                'lastName': comment['last_name'],
                'role': comment['role']
            }
        })
    
    conn.close()
    
    # Combine request data and comments
    request_data = {
        'id': req['id'],
        'title': req['title'],
        'description': req['description'],
        'status': req['status'],
        'priority': req['priority'],
        'department': req['department'],
        'userId': req['user_id'],
        'assignedTo': req['assigned_to'],
        'createdAt': req['created_at'],
        'updatedAt': req['updated_at'],
        'user': {
            'id': req['user_id'],
            'firstName': req['creator_first_name'],
            'lastName': req['creator_last_name']
        },
        'assignee': {
            'id': req['assigned_to'],
            'firstName': req['assignee_first_name'],
            'lastName': req['assignee_last_name']
        } if req['assignee_first_name'] else None,
        'comments': comments_list
    }
    
    return jsonify(request_data), 200

@app.route('/api/requests', methods=['POST'])
@token_required
def create_request():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'description', 'department', 'priority']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO requests (title, description, status, priority, department, user_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['title'],
        data['description'],
        'new',
        data['priority'],
        data['department'],
        request.user_id
    ))
    
    request_id = cursor.lastrowid
    conn.commit()
    
    # Get the created request
    req = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        WHERE r.id = ?
    ''', (request_id,)).fetchone()
    
    conn.close()
    
    request_data = {
        'id': req['id'],
        'title': req['title'],
        'description': req['description'],
        'status': req['status'],
        'priority': req['priority'],
        'department': req['department'],
        'userId': req['user_id'],
        'assignedTo': req['assigned_to'],
        'createdAt': req['created_at'],
        'updatedAt': req['updated_at'],
        'user': {
            'firstName': req['creator_first_name'],
            'lastName': req['creator_last_name']
        }
    }
    
    return jsonify(request_data), 201

@app.route('/api/requests/<int:request_id>', methods=['PUT'])
@token_required
def update_request(request_id):
    conn = get_db_connection()
    
    # Get request details
    req = conn.execute('SELECT * FROM requests WHERE id = ?', (request_id,)).fetchone()
    
    if not req:
        conn.close()
        return jsonify({'message': 'Request not found'}), 404
    
    # Check access rights - users can only update title/description of their own requests
    # Admins and techs can update status and assignee
    if request.user_role == 'user' and int(request.user_id) != req['user_id']:
        conn.close()
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    cursor = conn.cursor()
    
    # Build update query dynamically based on provided fields and permissions
    update_fields = []
    params = []
    
    # Fields any user can update for their own requests
    if int(request.user_id) == req['user_id']:
        if 'title' in data:
            update_fields.append('title = ?')
            params.append(data['title'])
        
        if 'description' in data:
            update_fields.append('description = ?')
            params.append(data['description'])
    
    # Fields admins and techs can update
    if request.user_role in ['admin', 'tech']:
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
        
        if 'assignedTo' in data:
            update_fields.append('assigned_to = ?')
            params.append(data['assignedTo'])
    
    # Only admins can change priority and department
    if request.user_role == 'admin':
        if 'priority' in data:
            update_fields.append('priority = ?')
            params.append(data['priority'])
        
        if 'department' in data:
            update_fields.append('department = ?')
            params.append(data['department'])
    
    update_fields.append('updated_at = CURRENT_TIMESTAMP')
    
    if not update_fields:
        conn.close()
        return jsonify({'message': 'No fields to update or permission denied'}), 400
    
    query = f"UPDATE requests SET {', '.join(update_fields)} WHERE id = ?"
    params.append(request_id)
    
    cursor.execute(query, params)
    conn.commit()
    
    # Get updated request
    req = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        WHERE r.id = ?
    ''', (request_id,)).fetchone()
    
    conn.close()
    
    request_data = {
        'id': req['id'],
        'title': req['title'],
        'description': req['description'],
        'status': req['status'],
        'priority': req['priority'],
        'department': req['department'],
        'userId': req['user_id'],
        'assignedTo': req['assigned_to'],
        'createdAt': req['created_at'],
        'updatedAt': req['updated_at'],
        'user': {
            'firstName': req['creator_first_name'],
            'lastName': req['creator_last_name']
        },
        'assignee': {
            'firstName': req['assignee_first_name'],
            'lastName': req['assignee_last_name']
        } if req['assignee_first_name'] else None
    }
    
    return jsonify(request_data), 200

# Comments routes
@app.route('/api/requests/<int:request_id>/comments', methods=['POST'])
@token_required
def add_comment(request_id):
    conn = get_db_connection()
    
    # Check if request exists
    req = conn.execute('SELECT * FROM requests WHERE id = ?', (request_id,)).fetchone()
    
    if not req:
        conn.close()
        return jsonify({'message': 'Request not found'}), 404
    
    # Check access rights
    if (request.user_role != 'admin' and 
        request.user_role != 'tech' and 
        int(request.user_id) != req['user_id']):
        conn.close()
        return jsonify({'message': 'Access denied'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('content'):
        conn.close()
        return jsonify({'message': 'Comment content is required'}), 400
    
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO comments (content, request_id, user_id)
    VALUES (?, ?, ?)
    ''', (
        data['content'],
        request_id,
        request.user_id
    ))
    
    comment_id = cursor.lastrowid
    conn.commit()
    
    # Get the created comment with user info
    comment = conn.execute('''
        SELECT c.*, u.first_name, u.last_name, u.role
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
    ''', (comment_id,)).fetchone()
    
    conn.close()
    
    comment_data = {
        'id': comment['id'],
        'content': comment['content'],
        'requestId': comment['request_id'],
        'userId': comment['user_id'],
        'createdAt': comment['created_at'],
        'user': {
            'firstName': comment['first_name'],
            'lastName': comment['last_name'],
            'role': comment['role']
        }
    }
    
    return jsonify(comment_data), 201

# Dashboard statistics
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats():
    conn = get_db_connection()
    
    # Get total requests count
    total_requests = conn.execute('SELECT COUNT(*) as count FROM requests').fetchone()['count']
    
    # Get open requests count
    open_requests = conn.execute(
        "SELECT COUNT(*) as count FROM requests WHERE status IN ('new', 'in_progress')"
    ).fetchone()['count']
    
    # Get resolved requests count
    resolved_requests = conn.execute(
        "SELECT COUNT(*) as count FROM requests WHERE status = 'resolved'"
    ).fetchone()['count']
    
    # Get average response time (mocked for demo)
    avg_response_time = 12.5  # In hours
    
    # Get requests by status
    status_counts = {}
    for status in ['new', 'in_progress', 'resolved', 'rejected']:
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE status = ?', 
            (status,)
        ).fetchone()['count']
        status_counts[status] = count
    
    # Get requests by department
    dept_counts = {}
    for dept in ['it', 'hr', 'finance', 'operations', 'customer_service']:
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE department = ?', 
            (dept,)
        ).fetchone()['count']
        dept_counts[dept] = count
    
    # Get requests by priority
    priority_counts = {}
    for priority in range(1, 6):
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE priority = ?', 
            (priority,)
        ).fetchone()['count']
        priority_counts[priority] = count
    
    # Get recent requests
    recent_requests = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        ORDER BY r.created_at DESC
        LIMIT 5
    ''').fetchall()
    
    recent_requests_list = []
    for req in recent_requests:
        recent_requests_list.append({
            'id': req['id'],
            'title': req['title'],
            'description': req['description'],
            'status': req['status'],
            'priority': req['priority'],
            'department': req['department'],
            'userId': req['user_id'],
            'assignedTo': req['assigned_to'],
            'createdAt': req['created_at'],
            'updatedAt': req['updated_at'],
            'user': {
                'firstName': req['creator_first_name'],
                'lastName': req['creator_last_name']
            },
            'assignee': {
                'firstName': req['assignee_first_name'],
                'lastName': req['assignee_last_name']
            } if req['assignee_first_name'] else None
        })
    
    conn.close()
    
    stats = {
        'totalRequests': total_requests,
        'openRequests': open_requests,
        'resolvedRequests': resolved_requests,
        'avgResponseTime': avg_response_time,
        'requestsByStatus': status_counts,
        'requestsByDepartment': dept_counts,
        'requestsByPriority': priority_counts,
        'recentRequests': recent_requests_list
    }
    
    return jsonify(stats), 200

@app.route('/api/dashboard/users/<int:user_id>/stats', methods=['GET'])
@token_required
def get_user_dashboard_stats(user_id):
    # Regular users can only access their own stats
    if request.user_role != 'admin' and int(request.user_id) != user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    conn = get_db_connection()
    
    # Get total requests count for user
    total_requests = conn.execute(
        'SELECT COUNT(*) as count FROM requests WHERE user_id = ?',
        (user_id,)
    ).fetchone()['count']
    
    # Get open requests count for user
    open_requests = conn.execute(
        "SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status IN ('new', 'in_progress')",
        (user_id,)
    ).fetchone()['count']
    
    # Get resolved requests count for user
    resolved_requests = conn.execute(
        "SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = 'resolved'",
        (user_id,)
    ).fetchone()['count']
    
    # Get average response time (mocked for demo)
    avg_response_time = 10.2  # In hours
    
    # Get requests by status for user
    status_counts = {}
    for status in ['new', 'in_progress', 'resolved', 'rejected']:
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND status = ?', 
            (user_id, status)
        ).fetchone()['count']
        status_counts[status] = count
    
    # Get requests by department for user
    dept_counts = {}
    for dept in ['it', 'hr', 'finance', 'operations', 'customer_service']:
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND department = ?', 
            (user_id, dept)
        ).fetchone()['count']
        dept_counts[dept] = count
    
    # Get requests by priority for user
    priority_counts = {}
    for priority in range(1, 6):
        count = conn.execute(
            'SELECT COUNT(*) as count FROM requests WHERE user_id = ? AND priority = ?', 
            (user_id, priority)
        ).fetchone()['count']
        priority_counts[priority] = count
    
    # Get recent requests for user
    recent_requests = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
        FROM requests r
        JOIN users u1 ON r.user_id = u1.id
        LEFT JOIN users u2 ON r.assigned_to = u2.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
    ''', (user_id,)).fetchall()
    
    recent_requests_list = []
    for req in recent_requests:
        recent_requests_list.append({
            'id': req['id'],
            'title': req['title'],
            'description': req['description'],
            'status': req['status'],
            'priority': req['priority'],
            'department': req['department'],
            'userId': req['user_id'],
            'assignedTo': req['assigned_to'],
            'createdAt': req['created_at'],
            'updatedAt': req['updated_at'],
            'user': {
                'firstName': req['creator_first_name'],
                'lastName': req['creator_last_name']
            },
            'assignee': {
                'firstName': req['assignee_first_name'],
                'lastName': req['assignee_last_name']
            } if req['assignee_first_name'] else None
        })
    
    conn.close()
    
    stats = {
        'totalRequests': total_requests,
        'openRequests': open_requests,
        'resolvedRequests': resolved_requests,
        'avgResponseTime': avg_response_time,
        'requestsByStatus': status_counts,
        'requestsByDepartment': dept_counts,
        'requestsByPriority': priority_counts,
        'recentRequests': recent_requests_list
    }
    
    return jsonify(stats), 200

# Initialize database and start the app
if __name__ == '__main__':
    if not os.path.exists(DATABASE):
        init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
    