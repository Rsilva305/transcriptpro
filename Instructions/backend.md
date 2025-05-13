```markdown
# Backend Implementation Guide - AI Transcription Service MVP

**Version: 1.0**
**Date: May 13, 2025**

## 1. Document Header

(Included above)

## 2. API Design

The backend API will follow a RESTful approach, using JSON for requests and responses. Authentication will be token-based (JWT).

**Base URL:** `https://api.yourtranscriptionservice.com/v1` (or similar)

**Key Endpoints:**

*   **Authentication:**
    *   `POST /auth/register`
        *   **Description:** Registers a new user.
        *   **Request Payload:** `{ "email": "user@example.com", "password": "securepassword" }`
        *   **Response Payload:** `{ "message": "User registered successfully" }` or `{ "error": "..." }`
    *   `POST /auth/login`
        *   **Description:** Logs in a user and issues a JWT.
        *   **Request Payload:** `{ "email": "user@example.com", "password": "password" }`
        *   **Response Payload:** `{ "token": "jwt_token_here", "user": { ...user_details } }` or `{ "error": "..." }`
    *   `GET /auth/me` (Protected)
        *   **Description:** Get details of the authenticated user.
        *   **Response Payload:** `{ "user": { "id": ..., "email": ..., "quota_minutes": ... } }`

*   **File Management & Transcription:**
    *   `POST /files/upload` (Protected)
        *   **Description:** Uploads an audio/video file. The actual transcription initiation is a separate step to allow for potential metadata checks or user confirmation later.
        *   **Request Payload:** `multipart/form-data` with the file.
        *   **Response Payload:** `{ "file_id": "uuid", "filename": "...", "status": "uploaded", "duration_seconds": ... }` or `{ "error": "..." }`
    *   `POST /transcriptions` (Protected)
        *   **Description:** Initiates the transcription process for an uploaded file. Checks user quota.
        *   **Request Payload:** `{ "file_id": "uuid_of_uploaded_file" }`
        *   **Response Payload:** `{ "transcription_id": "uuid", "file_id": "...", "status": "queued", "message": "Transcription initiated" }` or `{ "error": "Insufficient quota", ... }`
    *   `GET /transcriptions/{transcription_id}` (Protected)
        *   **Description:** Gets the status and details of a specific transcription. Includes the transcript text if status is 'completed'.
        *   **Response Payload:** `{ "transcription_id": "uuid", "file_id": "...", "status": "queued" | "processing" | "completed" | "failed", "progress_percentage": 0-100, "transcript_text": "...", "created_at": "..." }` or `{ "error": "..." }`
    *   `GET /files` (Protected)
        *   **Description:** Lists all files uploaded by the authenticated user, including associated transcription IDs and statuses.
        *   **Response Payload:** `[{ "file_id": "...", "filename": "...", "upload_date": "...", "transcription_id": "...", "transcription_status": "...", "duration_seconds": ... }, ...]`
    *   `GET /transcriptions` (Protected)
        *   **Description:** Lists all transcriptions for the authenticated user.
        *   **Response Payload:** `[{ "transcription_id": "...", "file_id": "...", "status": "...", "created_at": "..." }, ...]`

*   **Transcript Editing:**
    *   `PUT /transcriptions/{transcription_id}/text` (Protected)
        *   **Description:** Updates the transcript text for a completed transcription.
        *   **Request Payload:** `{ "transcript_text": "Your updated transcript text." }`
        *   **Response Payload:** `{ "transcription_id": "uuid", "status": "completed", "message": "Transcript updated successfully" }` or `{ "error": "..." }`

*   **Export:**
    *   `GET /transcriptions/{transcription_id}/export` (Protected)
        *   **Description:** Exports the transcript in a specified format.
        *   **Query Parameters:** `format` (e.g., `txt`, `srt`, `vtt`).
        *   **Response:** File download in the requested format. Returns error if transcription is not completed or format is invalid.

*   **Freemium/Quota:**
    *   `GET /user/quota` (Protected)
        *   **Description:** Gets the authenticated user's remaining transcription quota (e.g., minutes).
        *   **Response Payload:** `{ "quota_minutes_remaining": 120 }`

## 3. Data Models

Using a relational database (e.g., PostgreSQL) for structured data.

**`users` Table:**

*   `id` (UUID or Integer, Primary Key)
*   `email` (VARCHAR, Unique, Not Null)
*   `password_hash` (VARCHAR, Not Null) - Store hashed passwords using bcrypt or similar.
*   `created_at` (TIMESTAMP with time zone, Not Null)
*   `updated_at` (TIMESTAMP with time zone, Not Null)
*   `quota_minutes` (INTEGER, Not Null, Default: initial freemium minutes)

**`files` Table:**

*   `id` (UUID or Integer, Primary Key)
*   `user_id` (UUID or Integer, Foreign Key referencing `users.id`, Not Null)
*   `original_filename` (VARCHAR, Not Null)
*   `stored_filename` (VARCHAR, Not Null) - Unique internal name (e.g., UUID.mp4).
*   `storage_url` (VARCHAR, Not Null) - Path/URL in cloud storage (e.g., S3 bucket path).
*   `file_size` (BIGINT) - In bytes.
*   `duration_seconds` (INTEGER) - Estimated duration from file metadata.
*   `upload_status` (VARCHAR, Not Null, e.g., 'uploaded', 'failed_upload')
*   `created_at` (TIMESTAMP with time zone, Not Null)

**`transcriptions` Table:**

*   `id` (UUID or Integer, Primary Key)
*   `file_id` (UUID or Integer, Foreign Key referencing `files.id`, Unique, Not Null) - One transcription per file for MVP.
*   `user_id` (UUID or Integer, Foreign Key referencing `users.id`, Not Null) - Denormalized for easier querying.
*   `status` (VARCHAR, Not Null, e.g., 'queued', 'processing', 'completed', 'failed')
*   `progress_percentage` (INTEGER, Default: 0) - For showing progress.
*   `transcript_text` (TEXT or JSONB, Nullable) - Store the final transcript text. JSONB could be used later for structured segments, but TEXT is simpler for MVP.
*   `created_at` (TIMESTAMP with time zone, Not Null)
*   `updated_at` (TIMESTAMP with time zone, Not Null)
*   `completed_at` (TIMESTAMP with time zone, Nullable) - When status becomes 'completed' or 'failed'.
*   `processing_time_seconds` (INTEGER, Nullable) - Time taken by the AI engine.

**Indexing:**

*   Index `user_id` on `files` and `transcriptions` for fast user-specific queries.
*   Index `status` on `transcriptions` for queue processing and status checks.
*   Index `file_id` on `transcriptions`.

## 4. Business Logic

**Core Flows:**

1.  **User Registration/Login:**
    *   Register: Hash password, create `users` record with default `quota_minutes`.
    *   Login: Verify password hash, generate JWT with user ID and potentially quota information.
2.  **File Upload:**
    *   Receive file via `multipart/form-data`.
    *   Validate file type/size (basic checks).
    *   Generate a unique `stored_filename`.
    *   Upload file to secure cloud storage (e.g., S3).
    *   Extract basic metadata (duration, file size).
    *   Create `files` record with `user_id`, `original_filename`, `stored_filename`, `storage_url`, `duration_seconds`, `upload_status: 'uploaded'`.
    *   Return `file_id`.
3.  **Initiate Transcription:**
    *   Receive `file_id` and authenticated `user_id`.
    *   Verify the file belongs to the user.
    *   Retrieve user's `quota_minutes`.
    *   Retrieve file's `duration_seconds`.
    *   Check if `quota_minutes` >= `duration_seconds`. Return error if not.
    *   Create a `transcriptions` record with `file_id`, `user_id`, `status: 'queued'`.
    *   *Crucially:* Publish a message to a message queue (e.g., RabbitMQ, SQS, Redis Queue) containing the `transcription_id`. This decouples the web request from the heavy processing.
    *   Return success response with `transcription_id`.
4.  **Transcription Processing (Background Worker):**
    *   A separate background worker process(es) consumes messages from the queue.
    *   For each message (`transcription_id`):
        *   Fetch the `transcriptions` record and associated `files` record.
        *   Update `transcriptions.status` to 'processing'.
        *   Download the file from cloud storage.
        *   Call the AI transcription engine API (or run a local model). This is the CPU/GPU intensive step. Handle potential timeouts and errors.
        *   Update `transcriptions.progress_percentage` periodically if the AI engine supports progress updates.
        *   Upon completion (success or failure) from the AI engine:
            *   If successful: Store the result in `transcriptions.transcript_text`, update `status` to 'completed', set `completed_at` and `processing_time_seconds`. Deduct `processing_time_seconds` (or `duration_seconds`) from the user's `quota_minutes` in the `users` table (using a transaction to ensure atomicity).
            *   If failed: Update `status` to 'failed', set `completed_at`. Log the error. Do *not* deduct quota.
        *   Implement retry logic for transient failures.
5.  **Fetching Transcription:**
    *   Receive `transcription_id` and authenticated `user_id`.
    *   Verify the transcription belongs to the user.
    *   Fetch the `transcriptions` record.
    *   Return the record data, including `transcript_text` if status is 'completed'.
6.  **Basic Transcript Editor:**
    *   Receive `transcription_id`, authenticated `user_id`, and new `transcript_text`.
    *   Verify the transcription belongs to the user.
    *   Verify the transcription `status` is 'completed'.
    *   Update the `transcript_text` field in the `transcriptions` table.
    *   Return success.
7.  **Export:**
    *   Receive `transcription_id`, authenticated `user_id`, and `format`.
    *   Verify the transcription belongs to the user.
    *   Verify the transcription `status` is 'completed'.
    *   Fetch the `transcript_text`.
    *   Implement logic to format the `transcript_text` into the requested format (TXT is trivial, SRT/VTT require line breaks and potentially timestamp placeholders if the AI provides them - MVP can start with plain text export).
    *   Return the formatted content with the appropriate `Content-Type` header for download.

## 5. Security

*   **Authentication:**
    *   Use JWT (JSON Web Tokens) for authenticating API requests.
    *   Upon successful login, generate a token containing the user's ID and potentially other non-sensitive claims.
    *   The token is signed with a secret key known only to the backend.
    *   The client includes the token in the `Authorization: Bearer <token>` header for protected endpoints.
    *   The backend verifies the token's signature and expiration before processing requests.
*   **Authorization:**
    *   Implement strict ownership checks. A user can only access, initiate, update, or export *their own* files and transcriptions.
    *   On every protected route that involves a `file_id` or `transcription_id`, fetch the corresponding record from the database and compare the stored `user_id` with the `user_id` extracted from the authenticated JWT. Return 403 Forbidden if they don't match.
*   **Password Security:**
    *   Store only hashed passwords (e.g., using bcrypt). Never store plain passwords.
    *   Use a strong hashing algorithm with a salt.
*   **Data in Transit:**
    *   Enforce HTTPS for all API communication to encrypt data exchanged between clients and the server.
*   **Data at Rest:**
    *   Store uploaded files in a secure cloud storage service (e.g., S3) with restricted access policies (only the backend should have write/read access).
    *   Ensure database connections are encrypted.
*   **Input Validation:**
    *   Sanitize and validate all user inputs to prevent injection attacks (SQL injection, XSS, etc.).
*   **Rate Limiting:**
    *   Implement basic rate limiting on authentication endpoints (`/auth/login`, `/auth/register`) to mitigate brute-force attacks.
    *   Consider rate limiting on other endpoints to prevent abuse.

## 6. Performance

*   **Asynchronous Processing:** The transcription process is the primary bottleneck. It *must* be asynchronous. Use a message queue (RabbitMQ, SQS, Redis Queue) to decouple the web request from the transcription work.
*   **Background Workers:** Deploy dedicated worker processes that consume messages from the queue and perform the actual AI transcription tasks. These workers can be scaled independently based on the queue size and processing load.
*   **Database Indexing:** Ensure appropriate indexes are created (`user_id`, `file_id`, `status`) to make common queries (fetching user files, getting transcription status) fast.
*   **Efficient Storage Interaction:** Optimize file upload and download from cloud storage. Use streaming where possible for large files (though for transcription, the whole file is usually needed).
*   **AI Engine Optimization:** If using an external API, monitor its performance and latency. If running a local model, ensure it's running on appropriate hardware (CPU/GPU) and consider optimizations like batching if the API/model supports it and your workflow allows.
*   **Caching:** For frequently accessed, non-changing data (less critical for MVP but good practice), consider caching. Status checks might benefit, but transcription status changes, so caching needs careful consideration.
*   **Scalability:** Design the architecture to be horizontally scalable: stateless API servers, scalable message queue, scalable worker pool, and a database that can handle increasing load (read replicas initially).

## 7. Code Examples

Examples using Python with Flask and common libraries (placeholders for DB and Queue).

```python
# --- Imports (Conceptual) ---
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import uuid
import bcrypt
import jwt
import time
from datetime import datetime, timedelta
# Assume these are configured and available
# from your_db_library import db, User, File, Transcription
# from your_queue_library import queue as transcription_queue
# from your_storage_library import storage as cloud_storage # e.g., boto3 for S3
# from your_ai_library import ai_engine # Mock or actual AI client

# --- Configuration ---
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'super-secret-fallback-key')
app.config['UPLOAD_FOLDER'] = '/tmp/uploads' # Temporary local storage before cloud
# app.config['CLOUD_STORAGE_BUCKET'] = 'your-s3-bucket-name'
# app.config['FREEMIUM_QUOTA_MINUTES'] = 60 # e.g., 1 hour free transcription

# --- Database Mock (Replace with actual DB ORM like SQLAlchemy) ---
class MockDB:
    def __init__(self):
        self.users = {} # {id: User_object}
        self.files = {} # {id: File_object}
        self.transcriptions = {} # {id: Transcription_object}

    def add(self, obj):
        obj.id = str(uuid.uuid4()) # Simple UUID generation
        if isinstance(obj, User):
            self.users[obj.id] = obj
        elif isinstance(obj, File):
            self.files[obj.id] = obj
        elif isinstance(obj, Transcription):
            self.transcriptions[obj.id] = obj
        else:
            raise ValueError("Unknown object type")
        # Simulate commit
        return obj # Return object with ID

    def query(self, model):
        # Simple query mock
        if model == User: return list(self.users.values())
        if model == File: return list(self.files.values())
        if model == Transcription: return list(self.transcriptions.values())
        return []

    def get(self, model, id):
        if model == User: return self.users.get(id)
        if model == File: return self.files.get(id)
        if model == Transcription: return self.transcriptions.get(id)
        return None

    def filter(self, model, **kwargs):
         # Very basic filter mock
        items = self.query(model)
        results = []
        for item in items:
            match = True
            for key, value in kwargs.items():
                if not hasattr(item, key) or getattr(item, key) != value:
                    match = False
                    break
            if match:
                results.append(item)
        return results

    def commit(self):
        # Simulate DB commit (no-op for mock)
        pass

class User:
    def __init__(self, email, password_hash, quota_minutes):
        self.id = None # Set by db.add
        self.email = email
        self.password_hash = password_hash
        self.quota_minutes = quota_minutes
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

class File:
    def __init__(self, user_id, original_filename, stored_filename, storage_url, file_size, duration_seconds, upload_status):
        self.id = None # Set by db.add
        self.user_id = user_id
        self.original_filename = original_filename
        self.stored_filename = stored_filename
        self.storage_url = storage_url
        self.file_size = file_size
        self.duration_seconds = duration_seconds
        self.upload_status = upload_status
        self.created_at = datetime.utcnow()

class Transcription:
    def __init__(self, file_id, user_id, status):
        self.id = None # Set by db.add
        self.file_id = file_id
        self.user_id = user_id
        self.status = status # 'queued', 'processing', 'completed', 'failed'
        self.progress_percentage = 0
        self.transcript_text = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.completed_at = None
        self.processing_time_seconds = None # Actual time processed

db = MockDB() # Initialize Mock DB

# --- JWT Helper ---
def generate_jwt_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24), # Token expires in 24 hours
        'iat': datetime.utcnow(),
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def decode_jwt_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None # Signature expired
    except jwt.InvalidTokenError:
        return None # Invalid token

# --- Authentication Decorator ---
def requires_auth(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != 'bearer':
                return jsonify({"error": "Authorization header must be Bearer"}), 401
            user_id = decode_jwt_token(token)
            if not user_id:
                 return jsonify({"error": "Invalid or expired token"}), 401

            # Attach user_id to request context
            request.user_id = user_id
            return f(*args, **kwargs)
        except ValueError:
             return jsonify({"error": "Invalid Authorization header format"}), 401
        except Exception as e:
             print(f"Auth error: {e}") # Log unexpected errors
             return jsonify({"error": "Authentication failed"}), 500

    return decorated

# --- Endpoints ---

# AUTH
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Basic email format check
    if '@' not in email:
         return jsonify({"error": "Invalid email format"}), 400

    # Check if user already exists
    if db.filter(User, email=email):
        return jsonify({"error": "User with this email already exists"}), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Get initial quota from config (or database defaults)
    initial_quota = app.config.get('FREEMIUM_QUOTA_MINUTES', 60)

    new_user = User(email=email, password_hash=hashed_password, quota_minutes=initial_quota)
    db.add(new_user)
    db.commit()

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    users = db.filter(User, email=email)
    user = users[0] if users else None

    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        token = generate_jwt_token(user.id)
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "quota_minutes": user.quota_minutes
            }
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/auth/me', methods=['GET'])
@requires_auth
def get_me():
    user = db.get(User, request.user_id)
    if user:
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "quota_minutes": user.quota_minutes
            }
        }), 200
    # This should ideally not happen if requires_auth works, but good practice
    return jsonify({"error": "User not found"}), 404


# FILES & TRANSCRIPTIONS
@app.route('/files/upload', methods=['POST'])
@requires_auth
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        original_filename = secure_filename(file.filename)
        # Generate unique filename for storage
        stored_filename = f"{uuid.uuid4()}_{original_filename}"
        # Temporarily save locally
        temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file.save(temp_filepath)

        # --- Simulate Cloud Storage Upload ---
        # In real app:
        # storage_url = cloud_storage.upload(temp_filepath, app.config['CLOUD_STORAGE_BUCKET'], stored_filename)
        # os.remove(temp_filepath) # Clean up temp file

        # Mock storage URL and duration (real implementation extracts duration)
        storage_url = f"mock-s3://{app.config.get('CLOUD_STORAGE_BUCKET', 'mock-bucket')}/{stored_filename}"
        file_size = os.path.getsize(temp_filepath)
        duration_seconds = max(60, int(file_size / 100000)) # Simple mock: 1 min per ~100KB


        new_file = File(
            user_id=request.user_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            storage_url=storage_url,
            file_size=file_size,
            duration_seconds=duration_seconds,
            upload_status='uploaded'
        )
        db.add(new_file)
        db.commit()

        # Remove temporary local file after 'upload'
        os.remove(temp_filepath)


        return jsonify({
            "file_id": new_file.id,
            "filename": new_file.original_filename,
            "status": new_file.upload_status,
            "duration_seconds": new_file.duration_seconds,
            "message": "File uploaded successfully"
        }), 201
    # Should not be reached if file check passes, but as a fallback
    return jsonify({"error": "File upload failed"}), 500


@app.route('/transcriptions', methods=['POST'])
@requires_auth
def initiate_transcription():
    data = request.get_json()
    file_id = data.get('file_id')

    if not file_id:
        return jsonify({"error": "file_id is required"}), 400

    file = db.get(File, file_id)

    if not file or file.user_id != request.user_id:
        return jsonify({"error": "File not found or does not belong to user"}), 404

    # Check if transcription already exists for this file (MVP: one per file)
    existing_transcription = db.filter(Transcription, file_id=file_id)
    if existing_transcription:
        return jsonify({"error": "Transcription already initiated for this file", "transcription_id": existing_transcription[0].id}), 409

    # Check user quota
    user = db.get(User, request.user_id)
    required_minutes = (file.duration_seconds + 59) // 60 # Round up to nearest minute

    if user.quota_minutes < required_minutes:
        return jsonify({"error": "Insufficient quota", "quota_minutes_remaining": user.quota_minutes}), 402 # 402 Payment Required

    # Create transcription record
    new_transcription = Transcription(
        file_id=file.id,
        user_id=request.user_id,
        status='queued'
    )
    db.add(new_transcription)
    db.commit()

    # --- Send message to queue ---
    # In real app:
    # transcription_queue.send({
    #     'transcription_id': new_transcription.id,
    #     'file_storage_url': file.storage_url,
    #     'user_id': user.id, # Pass user_id to worker for quota update
    #     'estimated_duration_seconds': file.duration_seconds # Pass duration for quota check/deduction
    # })
    print(f"Mock Queue: Sending transcription job for ID: {new_transcription.id}") # Mock Queue action

    return jsonify({
        "transcription_id": new_transcription.id,
        "file_id": file.id,
        "status": new_transcription.status,
        "message": "Transcription queued successfully"
    }), 202 # 202 Accepted

@app.route('/transcriptions/<transcription_id>', methods=['GET'])
@requires_auth
def get_transcription(transcription_id):
    transcription = db.get(Transcription, transcription_id)

    if not transcription or transcription.user_id != request.user_id:
        return jsonify({"error": "Transcription not found or does not belong to user"}), 404

    response_data = {
        "transcription_id": transcription.id,
        "file_id": transcription.file_id,
        "status": transcription.status,
        "progress_percentage": transcription.progress_percentage,
        "created_at": transcription.created_at.isoformat()
    }

    if transcription.status == 'completed':
        response_data['transcript_text'] = transcription.transcript_text
        response_data['completed_at'] = transcription.completed_at.isoformat()
        response_data['processing_time_seconds'] = transcription.processing_time_seconds

    elif transcription.status == 'failed':
         response_data['completed_at'] = transcription.completed_at.isoformat()


    return jsonify(response_data), 200

@app.route('/files', methods=['GET'])
@requires_auth
def list_files():
    user_files = db.filter(File, user_id=request.user_id)
    files_list = []
    for file in user_files:
        # Find associated transcription if any (assuming one-to-one for MVP)
        transcriptions = db.filter(Transcription, file_id=file.id)
        transcription = transcriptions[0] if transcriptions else None

        files_list.append({
            "file_id": file.id,
            "filename": file.original_filename,
            "upload_date": file.created_at.isoformat(),
            "duration_seconds": file.duration_seconds,
            "transcription_id": transcription.id if transcription else None,
            "transcription_status": transcription.status if transcription else "not_initiated"
        })

    return jsonify(files_list), 200

@app.route('/transcriptions', methods=['GET'])
@requires_auth
def list_transcriptions():
    user_transcriptions = db.filter(Transcription, user_id=request.user_id)
    transcriptions_list = []
    for trans in user_transcriptions:
        transcriptions_list.append({
            "transcription_id": trans.id,
            "file_id": trans.file_id,
            "status": trans.status,
            "created_at": trans.created_at.isoformat(),
            # Optionally include progress or completion time
            "progress_percentage": trans.progress_percentage,
            "completed_at": trans.completed_at.isoformat() if trans.completed_at else None
        })

    # Sort by creation date, newest first
    transcriptions_list.sort(key=lambda x: x['created_at'], reverse=True)

    return jsonify(transcriptions_list), 200


# EDITING
@app.route('/transcriptions/<transcription_id>/text', methods=['PUT'])
@requires_auth
def update_transcript_text(transcription_id):
    transcription = db.get(Transcription, transcription_id)

    if not transcription or transcription.user_id != request.user_id:
        return jsonify({"error": "Transcription not found or does not belong to user"}), 404

    if transcription.status != 'completed':
        return jsonify({"error": "Transcript can only be edited when status is 'completed'"}), 400

    data = request.get_json()
    new_text = data.get('transcript_text')

    if new_text is None: # Allow empty string to clear text
         return jsonify({"error": "transcript_text field is required"}), 400

    transcription.transcript_text = str(new_text) # Ensure it's a string
    transcription.updated_at = datetime.utcnow()
    db.commit()

    return jsonify({
        "transcription_id": transcription.id,
        "status": transcription.status,
        "message": "Transcript updated successfully"
    }), 200


# EXPORT
@app.route('/transcriptions/<transcription_id>/export', methods=['GET'])
@requires_auth
def export_transcript(transcription_id):
    transcription = db.get(Transcription, transcription_id)

    if not transcription or transcription.user_id != request.user_id:
        return jsonify({"error": "Transcription not found or does not belong to user"}), 404

    if transcription.status != 'completed' or not transcription.transcript_text:
        return jsonify({"error": "Transcription not completed or text is empty"}), 400

    export_format = request.args.get('format', 'txt').lower() # Default to txt

    # --- Formatting Logic ---
    formatted_content = ""
    mimetype = "text/plain"
    filename_suffix = ".txt"

    if export_format == 'txt':
        formatted_content = transcription.transcript_text
        mimetype = "text/plain"
        filename_suffix = ".txt"
    elif export_format == 'srt':
        # --- Basic TXT to SRT Mock (Needs real segment data/timestamps from AI) ---
        # For MVP, just return text with line breaks
        lines = transcription.transcript_text.split('\n')
        srt_parts = []
        for i, line in enumerate(lines):
             if line.strip(): # Only add non-empty lines
                # This timestamp is FAKE for MVP
                start_time = i * 5 # 5 seconds apart
                end_time = start_time + 4
                srt_parts.append(f"{i+1}\n{start_time:02}:{start_time%60:02},{000} --> {end_time:02}:{end_time%60:02},{999}\n{line}\n")
        formatted_content = "\n".join(srt_parts)
        # Real SRT formatting requires segment timing information from the AI engine result
        mimetype = "application/x-subrip"
        filename_suffix = ".srt"
    elif export_format == 'vtt':
         # --- Basic TXT to VTT Mock (Similar to SRT, needs real data) ---
         lines = transcription.transcript_text.split('\n')
         vtt_parts = ["WEBVTT\n"]
         for i, line in enumerate(lines):
             if line.strip():
                start_time = i * 5
                end_time = start_time + 4
                vtt_parts.append(f"\n{start_time:02}:{start_time%60:02}.000 --> {end_time:02}:{end_time%60:02}.999\n{line}")
         formatted_content = "\n".join(vtt_parts)
         mimetype = "text/vtt"
         filename_suffix = ".vtt"
    else:
        return jsonify({"error": f"Unsupported export format: {export_format}"}), 400
    # --- End Formatting Logic ---

    # In a real app, you might save this to temp storage and use send_file or stream
    # For this example, we'll just send the content directly
    # Create a temporary file to use send_file
    try:
        temp_export_filename = f"{transcription_id}{filename_suffix}"
        temp_export_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_export_filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        with open(temp_export_path, "w", encoding='utf-8') as f:
            f.write(formatted_content)

        original_file = db.get(File, transcription.file_id)
        download_filename = f"{os.path.splitext(original_file.original_filename)[0]}{filename_suffix}"

        return send_file(temp_export_path, as_attachment=True, download_name=download_filename, mimetype=mimetype)
    finally:
        # Clean up the temporary file (needs error handling in real app)
        if os.path.exists(temp_export_path):
             os.remove(temp_export_path)


# QUOTA
@app.route('/user/quota', methods=['GET'])
@requires_auth
def get_user_quota():
    user = db.get(User, request.user_id)
    if user:
        return jsonify({"quota_minutes_remaining": user.quota_minutes}), 200
    return jsonify({"error": "User not found"}), 404


# --- Background Worker Mock (Conceptual) ---
# This code would run in a separate process, listening to the queue

# def transcription_worker():
#     print("Worker started...")
#     while True:
#         # --- Get job from queue ---
#         # In real app: job_data = transcription_queue.receive()
#         # Mock receiving a job after a delay
#         print("Worker waiting for job...")
#         time.sleep(10) # Simulate waiting for a queue message
#         # Mock Job Data Structure received from queue
#         # { 'transcription_id': '...', 'file_storage_url': '...', 'user_id': '...', 'estimated_duration_seconds': ... }
#         mock_job = get_mock_job_from_somewhere() # Needs a way to get a mock job for testing
#
#         if not mock_job:
#             continue # Keep listening if no job
#
#         transcription_id = mock_job['transcription_id']
#         file_url = mock_job['file_storage_url']
#         user_id_for_quota = mock_job['user_id'] # User ID needed to update quota later
#         estimated_duration = mock_job['estimated_duration_seconds']
#
#         transcription = db.get(Transcription, transcription_id)
#         if not transcription or transcription.status != 'queued':
#             print(f"Worker: Transcription {transcription_id} not found or not queued. Skipping.")
#             continue # Skip if record is gone or status changed
#
#         print(f"Worker: Processing transcription {transcription_id} from {file_url}")
#         transcription.status = 'processing'
#         db.commit()
#
#         try:
#             # --- Simulate File Download ---
#             print("Worker: Downloading file...")
#             # In real app: downloaded_file_path = cloud_storage.download(file_url)
#             # Mock: Just pretend download happens
#             downloaded_file_path = "/tmp/mock_downloaded_file.mp4" # Placeholder
#             # Ensure temp dir exists
#             os.makedirs(os.path.dirname(downloaded_file_path), exist_ok=True)
#             with open(downloaded_file_path, 'w') as f: # Create dummy file
                 f.write("dummy audio/video content")
#             print("Worker: File downloaded.")
#
#             # --- Call AI Engine ---
#             print("Worker: Sending to AI Engine...")
#             start_processing_time = time.time()
#             # In real app: result = ai_engine.transcribe(downloaded_file_path)
#             # Mock AI Processing: Simulate delay and generate dummy text
#             mock_processing_seconds = min(estimated_duration * 1.2, 300) # Simulate processing takes similar time, max 5 min mock
#             for i in range(10): # Simulate progress updates
#                  time.sleep(mock_processing_seconds / 10)
#                  transcription.progress_percentage = (i + 1) * 10
#                  db.commit() # Update progress in DB
#                  print(f"Worker: Progress {transcription.progress_percentage}%")
#             time.sleep(mock_processing_seconds * 0.5) # Final bit of processing
#             mock_transcript = f"This is a mock transcript for file {transcription.file_id}.\nIt was transcribed asynchronously at {datetime.utcnow().isoformat()}.\nThe original estimated duration was {estimated_duration} seconds."
#             actual_processing_time = time.time() - start_processing_time
#             print("Worker: AI Engine completed.")
#
#             # --- Update Transcription Record ---
#             transcription.transcript_text = mock_transcript
#             transcription.status = 'completed'
#             transcription.progress_percentage = 100
#             transcription.completed_at = datetime.utcnow()
#             transcription.processing_time_seconds = int(actual_processing_time)
#             db.commit()
#
#             # --- Deduct Quota (Atomic Transaction) ---
#             user = db.get(User, user_id_for_quota)
#             if user:
#                 # Deduct based on estimated duration (or actual processing time, policy choice)
#                 deduct_minutes = (estimated_duration + 59) // 60 # Round up
#                 # In a real DB with transactions:
#                 # db.start_transaction()
#                 # try:
#                 user.quota_minutes = max(0, user.quota_minutes - deduct_minutes) # Don't go below 0
#                 db.commit()
#                 # except Exception as e:
#                 #    db.rollback()
#                 #    print(f"Worker: Error deducting quota for user {user_id_for_quota}: {e}")
#                 print(f"Worker: Quota deducted for user {user_id_for_quota}. Remaining: {user.quota_minutes}")
#             else:
#                  print(f"Worker: User {user_id_for_quota} not found for quota deduction.")
#
#             print(f"Worker: Transcription {transcription_id} completed successfully.")
#
#         except Exception as e:
#             print(f"Worker: Error processing transcription {transcription_id}: {e}")
#             # --- Handle Failure ---
#             transcription.status = 'failed'
#             transcription.completed_at = datetime.utcnow()
#             db.commit()
#             # Log error, maybe send notification
#
#         finally:
#             # Clean up downloaded file
#             if os.path.exists(downloaded_file_path):
#                 os.remove(downloaded_file_path)
#
# # Mock function to simulate getting a job (replace with real queue consumption)
# mock_jobs_queue = []
# def add_mock_job_to_queue(job_data):
#      mock_jobs_queue.append(job_data)
#
# def get_mock_job_from_somewhere():
#     if mock_jobs_queue:
#         return mock_jobs_queue.pop(0)
#     return None

# --- Link mock queue send ---
# Replace the print statement in initiate_transcription with:
# add_mock_job_to_queue({
#      'transcription_id': new_transcription.id,
#      'file_storage_url': file.storage_url,
#      'user_id': user.id,
#      'estimated_duration_seconds': file.duration_seconds
# })

# --- How to run the worker (conceptual) ---
# In a real deployment, this would be a separate process or service.
# Example:
# if __name__ == '__main__':
#     import threading
#     # Start the worker in a separate thread for demonstration ONLY
#     # Use proper process management (like Celery, RQ, Kubernetes jobs) in production
#     worker_thread = threading.Thread(target=transcription_worker)
#     worker_thread.daemon = True # Allow main thread to exit
#     worker_thread.start()
#
#     # Run the Flask API server
#     app.run(debug=True, port=5000)

# Note: Running the worker in a separate thread within the Flask app process
# is NOT recommended for production due to resource contention, error handling,
# and scaling issues. Use dedicated worker processes/services.
```

This code provides a basic structure for the API endpoints and mocks the database and queue interactions. The background worker logic is outlined conceptually in the comments, emphasizing the need for a separate, asynchronous process. The core logic for authentication, file upload, initiation, status checking, editing, export, and quota management is demonstrated.

Remember to replace the mock database and queue implementations with actual libraries (e.g., SQLAlchemy for PostgreSQL, Pika for RabbitMQ, Boto3 for SQS, redis-py for Redis Queue). Implement robust error handling, logging, and input validation in a production system.
```
