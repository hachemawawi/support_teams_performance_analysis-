from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import jwt
import datetime
import uuid
import os
import hashlib
import json
from functools import wraps
from textblob import TextBlob
import re

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
DATABASE = 'support_system.db'
SECRET_KEY = 'your-secret-key'  # Change this in production
TOKEN_EXPIRATION = 24  # hours

# Sentiment Analysis Configuration
SENTIMENT_THRESHOLDS = {
    'very_negative': -0.6,
    'negative': -0.2,
    'neutral': 0.2,
    'positive': 0.6,
    'very_positive': float('inf')
}

def get_sentiment_score(polarity):
    if polarity <= SENTIMENT_THRESHOLDS['very_negative']:
        return 1  # VERY_NEGATIVE
    elif polarity <= SENTIMENT_THRESHOLDS['negative']:
        return 2  # NEGATIVE
    elif polarity <= SENTIMENT_THRESHOLDS['neutral']:
        return 3  # NEUTRAL
    elif polarity <= SENTIMENT_THRESHOLDS['positive']:
        return 4  # POSITIVE
    else:
        return 5  # VERY_POSITIVE

def analyze_sentiment(text):
    # Clean the text
    text = re.sub(r'[^\w\s]', '', text.lower())
    
    # Analyze sentiment
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Get keywords (nouns and adjectives)
    keywords = []
    for word, tag in blob.tags:
        if tag.startswith(('NN', 'JJ')):  # Nouns and adjectives
            keywords.append(word)
    
    # Get sentiment score
    score = get_sentiment_score(polarity)
    
    # Calculate confidence based on subjectivity
    confidence = 1 - subjectivity
    
    return {
        'score': score,
        'confidence': confidence,
        'keywords': keywords[:5],  # Limit to top 5 keywords
        'timestamp': datetime.datetime.utcnow().isoformat()
    }

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
        account_number TEXT,
        issue_type TEXT,
        location TEXT,
        service_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sentiment_score INTEGER,
        sentiment_confidence REAL,
        sentiment_keywords TEXT,
        sentiment_timestamp TIMESTAMP,
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
        sentiment_score INTEGER,
        sentiment_confidence REAL,
        sentiment_keywords TEXT,
        sentiment_timestamp TIMESTAMP,
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
            print('Auth header:', auth_header)  # Debug log
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                print('Extracted token:', token)  # Debug log
        
        if not token:
            print('No token found in request')  # Debug log
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            print('Attempting to decode token...')  # Debug log
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            print('Token payload:', payload)  # Debug log
            
            user_id = payload['sub']
            user_role = payload['role']
            
            conn = get_db_connection()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            
            if not user:
                print('User not found in database:', user_id)  # Debug log
                return jsonify({'message': 'User not found!'}), 401
            
            print('User found:', user)  # Debug log
            request.user_id = user_id
            request.user_role = user_role
            
            return f(*args, **kwargs)
        except Exception as e:
            print('Token validation error:', str(e))  # Debug log
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
                   u2.first_name as assignee_first_name, u2.last_name as assignee_last_name,
                   r.sentiment_score, r.sentiment_confidence, r.sentiment_keywords, r.sentiment_timestamp,
                   (
                       SELECT json_group_array(
                           json_object(
                               'score', c.sentiment_score,
                               'confidence', c.sentiment_confidence,
                               'keywords', c.sentiment_keywords,
                               'timestamp', c.sentiment_timestamp,
                               'content', c.content
                           )
                       )
                       FROM comments c
                       WHERE c.request_id = r.id
                   ) as comments_data
            FROM requests r
            JOIN users u1 ON r.user_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            ORDER BY r.created_at DESC
        ''').fetchall()
    else:
        # Regular users only see their own requests
        requests = conn.execute('''
            SELECT r.*, 
                   u1.first_name as creator_first_name, u1.last_name as creator_last_name,
                   u2.first_name as assignee_first_name, u2.last_name as assignee_last_name,
                   r.sentiment_score, r.sentiment_confidence, r.sentiment_keywords, r.sentiment_timestamp,
                   (
                       SELECT json_group_array(
                           json_object(
                               'score', c.sentiment_score,
                               'confidence', c.sentiment_confidence,
                               'keywords', c.sentiment_keywords,
                               'timestamp', c.sentiment_timestamp,
                               'content', c.content
                           )
                       )
                       FROM comments c
                       WHERE c.request_id = r.id
                   ) as comments_data
            FROM requests r
            JOIN users u1 ON r.user_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ''', (request.user_id,)).fetchall()
    
    conn.close()
    
    requests_list = []
    for req in requests:
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
        
        # Add sentiment data if available
        if req['sentiment_score']:
            request_data['overallSentiment'] = {
                'score': req['sentiment_score'],
                'confidence': req['sentiment_confidence'],
                'keywords': json.loads(req['sentiment_keywords']) if req['sentiment_keywords'] else [],
                'timestamp': req['sentiment_timestamp']
            }
        
        # Add comments sentiment data
        if req['comments_data']:
            try:
                comments_data = json.loads(req['comments_data'])
                request_data['comments'] = [{
                    'sentiment': {
                        'score': comment['score'],
                        'confidence': comment['confidence'],
                        'keywords': json.loads(comment['keywords']) if comment['keywords'] else [],
                        'timestamp': comment['timestamp']
                    },
                    'content': comment['content']
                } for comment in comments_data if comment['score'] is not None]
            except (json.JSONDecodeError, KeyError):
                request_data['comments'] = []
        
        requests_list.append(request_data)
    
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
    
    # Get request details with sentiment data
    req = conn.execute('''
        SELECT r.*, 
               u1.first_name as creator_first_name, u1.last_name as creator_last_name,
               u2.first_name as assignee_first_name, u2.last_name as assignee_last_name,
               r.sentiment_score, r.sentiment_confidence, r.sentiment_keywords, r.sentiment_timestamp
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
    
    # Get comments with sentiment data
    comments = conn.execute('''
        SELECT c.*, u.first_name, u.last_name, u.role,
               c.sentiment_score, c.sentiment_confidence, c.sentiment_keywords, c.sentiment_timestamp
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.request_id = ?
        ORDER BY c.created_at ASC
    ''', (request_id,)).fetchall()
    
    comments_list = []
    for comment in comments:
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
        
        # Add sentiment data if available
        if comment['sentiment_score'] is not None:
            comment_data['sentiment'] = {
                'score': comment['sentiment_score'],
                'confidence': comment['sentiment_confidence'],
                'keywords': json.loads(comment['sentiment_keywords']) if comment['sentiment_keywords'] else [],
                'timestamp': comment['sentiment_timestamp']
            }
        
        comments_list.append(comment_data)
    
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
    
    # Add overall sentiment data if available
    if req['sentiment_score'] is not None:
        request_data['overallSentiment'] = {
            'score': req['sentiment_score'],
            'confidence': req['sentiment_confidence'],
            'keywords': json.loads(req['sentiment_keywords']) if req['sentiment_keywords'] else [],
            'timestamp': req['sentiment_timestamp']
        }
    
    conn.close()
    return jsonify(request_data), 200

@app.route('/api/requests', methods=['POST'])
@token_required
def create_request():
    print('\n=== Creating new request ===')
    print('User ID from token:', request.user_id)
    print('User role from token:', request.user_role)
    
    try:
        data = request.get_json()
        print('Request data:', json.dumps(data, indent=2))
        
        # Validate required fields
        required_fields = ['title', 'description']
        for field in required_fields:
            if field not in data:
                print(f'Missing required field: {field}')
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Analyze sentiment of the request
        try:
            sentiment = analyze_sentiment(data['description'])
            print('Sentiment analysis:', json.dumps(sentiment, indent=2))
        except Exception as e:
            print('Error in sentiment analysis:', str(e))
            sentiment = {
                'score': 3,  # Default to neutral
                'confidence': 0.5,
                'keywords': [],
                'timestamp': datetime.datetime.utcnow().isoformat()
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            print('Preparing SQL insert...')
            sql = '''
            INSERT INTO requests (
                title, description, status, priority, department, user_id,
                account_number, issue_type, location, service_type,
                sentiment_score, sentiment_confidence, sentiment_keywords, sentiment_timestamp
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            # Determine department based on service type and issue type
            department = 'it'  # Default to IT
            if data.get('serviceType') == 'billing':
                department = 'finance'
            elif data.get('serviceType') == 'technical':
                department = 'it'
            elif data.get('serviceType') == 'customer_service':
                department = 'customer_service'
            elif data.get('serviceType') == 'sales':
                department = 'sales'
            elif data.get('issueType') in ['installation', 'equipment', 'maintenance']:
                department = 'operations'
            elif data.get('issueType') in ['billing', 'payment', 'refund']:
                department = 'finance'
            elif data.get('issueType') in ['technical', 'software', 'hardware']:
                department = 'it'
            elif data.get('issueType') in ['service', 'support', 'complaint']:
                department = 'customer_service'
            
            # Set default priority based on sentiment and issue type
            priority = 3  # Default to medium
            if sentiment['score'] <= 2:  # Negative sentiment
                priority = 2  # High priority
            if data.get('issueType') == 'connectivity':
                priority = 2  # High priority for connectivity issues
            
            params = (
                data['title'],
                data['description'],
                'new',  # Default status
                priority,
                department,
                request.user_id,
                data.get('accountNumber'),
                data.get('issueType'),
                data.get('location'),
                data.get('serviceType'),
                sentiment['score'],
                sentiment['confidence'],
                json.dumps(sentiment['keywords']),
                sentiment['timestamp']
            )
            print('SQL:', sql)
            print('Parameters:', params)
            
            print('Executing SQL insert...')
            cursor.execute(sql, params)
            
            request_id = cursor.lastrowid
            conn.commit()
            print('Request created with ID:', request_id)
            
            # Get the created request with user info
            print('Fetching created request...')
            request_data = conn.execute('''
            SELECT r.*, u.first_name, u.last_name, u.email
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
            ''', (request_id,)).fetchone()
            
            print('Created request data:', dict(request_data))
            
            conn.close()
            
            response_data = {
                'id': request_data['id'],
                'title': request_data['title'],
                'description': request_data['description'],
                'status': request_data['status'],
                'priority': request_data['priority'],
                'department': request_data['department'],
                'userId': request_data['user_id'],
                'assignedTo': request_data['assigned_to'],
                'accountNumber': request_data['account_number'],
                'issueType': request_data['issue_type'],
                'location': request_data['location'],
                'serviceType': request_data['service_type'],
                'createdAt': request_data['created_at'],
                'updatedAt': request_data['updated_at'],
                'user': {
                    'id': request_data['user_id'],
                    'firstName': request_data['first_name'],
                    'lastName': request_data['last_name'],
                    'email': request_data['email']
                },
                'sentiment': {
                    'score': request_data['sentiment_score'],
                    'confidence': request_data['sentiment_confidence'],
                    'keywords': json.loads(request_data['sentiment_keywords']),
                    'timestamp': request_data['sentiment_timestamp']
                }
            }
            print('Response data:', json.dumps(response_data, indent=2))
            return jsonify(response_data), 201
            
        except sqlite3.Error as e:
            print('Database error:', str(e))
            print('Error details:', e.__dict__)
            conn.close()
            return jsonify({'message': f'Database error: {str(e)}'}), 500
        except Exception as e:
            print('Error creating request:', str(e))
            print('Error details:', e.__dict__)
            conn.close()
            return jsonify({'message': f'Error creating request: {str(e)}'}), 500
    except Exception as e:
        print('Error processing request:', str(e))
        print('Error details:', e.__dict__)
        return jsonify({'message': f'Error processing request: {str(e)}'}), 500

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
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'message': 'Content is required'}), 400
    
    conn = get_db_connection()
    request_data = conn.execute('SELECT * FROM requests WHERE id = ?', (request_id,)).fetchone()
    
    if not request_data:
        conn.close()
        return jsonify({'message': 'Request not found'}), 404
    
    # Analyze comment sentiment
    sentiment = analyze_sentiment(data['content'])
    
    # Add comment with sentiment
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO comments (content, request_id, user_id, sentiment_score, sentiment_confidence, sentiment_keywords, sentiment_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['content'],
        request_id,
        request.user_id,
        sentiment['score'],
        sentiment['confidence'],
        json.dumps(sentiment['keywords']),
        sentiment['timestamp']
    ))
    
    comment_id = cursor.lastrowid
    
    # Get all comments for this request to calculate overall sentiment
    comments = conn.execute('''
        SELECT sentiment_score, sentiment_confidence, content
        FROM comments 
        WHERE request_id = ? AND user_id IN (
            SELECT id FROM users WHERE role = 'user'
        )
    ''', (request_id,)).fetchall()
    
    # Calculate overall sentiment
    total_score = 0
    total_confidence = 0
    all_text = request_data['description']  # Include original request text
    
    for comment in comments:
        if comment['sentiment_score']:
            total_score += comment['sentiment_score']
            total_confidence += comment['sentiment_confidence']
            all_text += ' ' + comment['content']
    
    # Calculate averages and analyze combined text
    num_comments = len(comments)
    if num_comments > 0:
        avg_score = round(total_score / num_comments)
        avg_confidence = total_confidence / num_comments
        overall_sentiment = analyze_sentiment(all_text)
    else:
        # If no comments, use the original request sentiment
        avg_score = sentiment['score']
        avg_confidence = sentiment['confidence']
        overall_sentiment = sentiment
    
    # Update request's overall sentiment
    cursor.execute('''
    UPDATE requests 
    SET sentiment_score = ?,
        sentiment_confidence = ?,
        sentiment_keywords = ?,
        sentiment_timestamp = ?
    WHERE id = ?
    ''', (
        avg_score,
        avg_confidence,
        json.dumps(overall_sentiment['keywords']),
        datetime.datetime.utcnow().isoformat(),
        request_id
    ))
    
    conn.commit()
    
    # Get the created comment with user info
    comment = conn.execute('''
    SELECT c.*, u.first_name, u.last_name, u.email, u.role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
    ''', (comment_id,)).fetchone()
    
    # Get updated request data
    request_data = conn.execute('''
    SELECT sentiment_score, sentiment_confidence, sentiment_keywords, sentiment_timestamp
    FROM requests
    WHERE id = ?
    ''', (request_id,)).fetchone()
    
    conn.close()
    
    return jsonify({
        'id': comment['id'],
        'content': comment['content'],
        'requestId': comment['request_id'],
        'userId': comment['user_id'],
        'createdAt': comment['created_at'],
        'user': {
            'id': comment['user_id'],
            'firstName': comment['first_name'],
            'lastName': comment['last_name'],
            'email': comment['email'],
            'role': comment['role']
        },
        'sentiment': {
            'score': comment['sentiment_score'],
            'confidence': comment['sentiment_confidence'],
            'keywords': json.loads(comment['sentiment_keywords']),
            'timestamp': comment['sentiment_timestamp']
        },
        'requestSentiment': {
            'score': request_data['sentiment_score'],
            'confidence': request_data['sentiment_confidence'],
            'keywords': json.loads(request_data['sentiment_keywords']),
            'timestamp': request_data['sentiment_timestamp']
        }
    })

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

@app.route('/api/analyze-sentiment', methods=['POST'])
@token_required
def analyze_text_sentiment():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'message': 'Text is required'}), 400
    
    sentiment = analyze_sentiment(data['text'])
    return jsonify(sentiment)

@app.route('/api/requests/<int:request_id>/analyze-sentiment', methods=['POST'])
@token_required
def analyze_request_sentiment(request_id):
    conn = get_db_connection()
    request_data = conn.execute('SELECT * FROM requests WHERE id = ?', (request_id,)).fetchone()
    
    if not request_data:
        conn.close()
        return jsonify({'message': 'Request not found'}), 404
    
    # Get all comments for this request
    comments = conn.execute('SELECT * FROM comments WHERE request_id = ?', (request_id,)).fetchall()
    
    # Combine request description and all comments
    all_text = request_data['description']
    for comment in comments:
        all_text += ' ' + comment['content']
    
    # Analyze combined sentiment
    sentiment = analyze_sentiment(all_text)
    
    # Update request sentiment
    conn.execute('''
    UPDATE requests 
    SET sentiment_score = ?,
        sentiment_confidence = ?,
        sentiment_keywords = ?,
        sentiment_timestamp = ?
    WHERE id = ?
    ''', (
        sentiment['score'],
        sentiment['confidence'],
        json.dumps(sentiment['keywords']),
        sentiment['timestamp'],
        request_id
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify(sentiment)

# Initialize database and start the app
if __name__ == '__main__':
    print('Starting server...')
    
    # Only initialize database if it doesn't exist
    if not os.path.exists(DATABASE):
        print('Database not found. Creating new database...')
        init_db()
        print('Database initialized successfully')
    else:
        print('Using existing database')
    
    print('Starting Flask server...')
    app.run(debug=True, host='0.0.0.0', port=5051)
    