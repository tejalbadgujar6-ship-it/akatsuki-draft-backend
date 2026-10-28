# Akatsuki’s Draft: AI-Enabled Content Sharing Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://mongoosejs.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%20API-orange.svg)](https://ai.google.dev/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-red.svg)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing-brightgreen.svg)](#running-automated-tests)

A secure, modular, enterprise-grade backend built for **Nodevember 4.0**. Akatsuki’s Draft is an AI-enabled publishing ecosystem where authors can write, draft, and enhance articles with **Google Gemini AI**, and submit them through an **editorial admin review lifecycle** before public release.

---

## 🌟 Key Features

1. **Authentication & Identity**:
   - Secure registration and login with `bcryptjs` password hashing (salt rounds: 10).
   - Strict privilege boundary: Public registration can **never** assign the `admin` role.
   - JWT-based authentication with expiration validation and protected routes.
   - Initial admin account setup via secure seeding script or environment variable trigger.

2. **Editorial Content Lifecycle**:
   - Multi-state workflow: `draft` ➔ `pending` ➔ `approved` / `rejected`.
   - New articles submitted for publication enter `pending` and require admin review.
   - Drafts remain private in `draft` state.
   - **Content Integrity Protection**: Modifying an approved post automatically demotes it back to `pending`, preventing unauthorized changes from bypassing editorial review.
   - Author ownership enforcement: Users can only update or delete their own posts.

3. **Public Exploration**:
   - Public feed (`GET /posts`) and detail views (`GET /posts/:id`) strictly isolate and expose **only** `approved` articles.
   - Drafts, pending articles, and rejected submissions are completely hidden from public access.

4. **Google Gemini AI Content Improvement**:
   - Uses the official **Google Generative AI SDK** (`@google/generative-ai`).
   - Improves grammar, readability, flow, and structure while preserving the author's original meaning and facts.
   - **Non-destructive Preservation**: The original post remains 100% untouched. The improved version is saved as a **new `draft` Post document** with a unique MongoDB ID linked to the same author.
   - Configurable model (defaults to `gemini-1.5-flash`).

5. **Safe File & Image Uploads**:
   - Handled via `multer` with MIME-type allowlists (JPEG, PNG, WEBP, GIF).
   - 5MB file size limit and filename sanitization.
   - Stored in a dedicated local directory and served as static assets.

6. **Defensive Architecture & Security**:
   - Centralized error-handling middleware sanitizing internal exceptions and stack traces in production.
   - `helmet` security headers, CORS support, and input validation schemas.
   - Clean, standardized API response format: `{ success, statusCode, message, data }`.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js (v20+ / v24+ ESM modules) |
| **Web Framework** | Express.js (v4.21.2) |
| **Database & ODM** | MongoDB with Mongoose (v8.10.0) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` |
| **Artificial Intelligence**| Google GenAI SDK (`@google/generative-ai`) |
| **File Handling** | Multer (v1.4.5-lts) |
| **Security & Utilities** | Helmet, CORS, Morgan, Dotenv |
| **Test Suite** | Native Node.js Test Runner (`node:test`, `node:assert`) + `supertest` + `mongodb-memory-server` |

---

## 📂 Project Structure

```
akatsuki-draft-backend/
├── .env.example                               # Environment variable template
├── Akatsukis_Draft_API.postman_collection.json # Ready-to-import Postman collection
├── package.json                               # Dependencies and scripts (ES modules)
├── README.md                                  # Complete project documentation
├── uploads/                                   # Uploaded article cover images
├── src/
│   ├── app.js                                 # Express application configuration & middlewares
│   ├── server.js                              # Server bootstrap, DB connection, admin seed
│   ├── config/
│   │   ├── db.js                              # MongoDB connection lifecycle management
│   │   └── gemini.js                          # Google Gemini AI SDK client and prompts
│   ├── controllers/
│   │   ├── authController.js                  # Register, login, current profile (me)
│   │   ├── postController.js                  # User post CRUD and public discovery
│   │   ├── adminController.js                 # Admin pending queue, approve, reject
│   │   └── aiController.js                    # AI non-destructive content improvement
│   ├── middleware/
│   │   ├── authMiddleware.js                  # JWT verification & role authorization
│   │   ├── errorMiddleware.js                 # Global error handler & 404 handler
│   │   ├── uploadMiddleware.js                # Multer image upload filter & limits
│   │   └── validateMiddleware.js              # Request validation & ObjectId checks
│   ├── models/
│   │   ├── User.js                            # Mongoose User schema (bcrypt pre-save, toJSON)
│   │   └── Post.js                            # Mongoose Post schema (indexes, timestamps)
│   ├── routes/
│   │   ├── index.js                           # Master route mounting & health check
│   │   ├── authRoutes.js                      # /auth endpoints
│   │   ├── postRoutes.js                      # /posts endpoints
│   │   ├── adminRoutes.js                     # /admin endpoints
│   │   └── aiRoutes.js                        # /ai endpoints
│   ├── scripts/
│   │   └── seedAdmin.js                       # CLI & programmatic first-admin seeder
│   └── utils/
│       ├── apiError.js                        # Operational ApiError helper
│       ├── apiResponse.js                     # Standardized JSON response envelope
│       ├── asyncHandler.js                    # Async route error wrapper
│       └── logger.js                          # Structured console logger
└── tests/
    ├── setup.js                               # In-memory MongoDB test lifecycle
    ├── all.test.js                            # Master test suite runner
    ├── auth.test.js                           # Authentication integration tests
    ├── post.test.js                           # Post management integration tests
    ├── admin.test.js                          # Admin approval integration tests
    └── ai.test.js                             # AI improvement integration tests
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js** v20.x or v24.x installed (`node -v`)
- **MongoDB** instance (local MongoDB service, Docker container, or MongoDB Atlas cluster)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Clone / Navigate to Directory
```bash
cd "C:\Users\HP\.gemini\antigravity\scratch\akatsuki-draft-backend"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your values:
```ini
PORT=5000
NODE_ENV=development

# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/akatsukis_draft

# JWT Authentication
JWT_SECRET=super_secure_random_jwt_secret_key_at_least_32_characters
JWT_EXPIRES_IN=24h

# Google Gemini AI Configuration
GEMINI_API_KEY=AIzaSy...your_real_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Initial Admin Credentials (Auto-seeded on boot if not existing)
ADMIN_NAME=Akatsuki Leader
ADMIN_EMAIL=admin@akatsuki.dev
ADMIN_PASSWORD=Admin@Akatsuki2026

# Set to true only if testing offline without a Gemini API Key
USE_AI_MOCK=false
```

### 5. Seed the First Admin User
Public registration strictly rejects assigning the `admin` role. Run the secure setup script:
```bash
npm run seed:admin
```
*(Alternatively, when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are defined in `.env`, the server automatically seeds the admin on first startup if no admin exists).*

### 6. Start the Server
- **Development Mode** (with file watching):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

---

## 🧪 Running Automated Tests

The project includes an end-to-end integration test suite using **in-memory MongoDB** (`mongodb-memory-server`) and `supertest`. It tests every single positive and negative scenario without touching your development database:

```bash
npm test
```

### Test Suite Coverage (40/40 Passing):
- **Authentication**: User registration, password hashing, JWT signing, profile retrieval, email uniqueness (409), input validation (400), token expiration & malformation (401), and **prevention of admin role assignment**.
- **Post Management**: Creation of pending posts, saving drafts, public visibility isolation (only `approved`), author-only updates, protected fields protection, **automatic reversion of edited approved posts to `pending`**, and author deletion.
- **Admin Approval**: Pending review queue, post approval, post rejection, and **403 Forbidden enforcement on non-admin users**.
- **Google Gemini AI**: Retrieval of post, generation of improved content, creation of a **new draft with a new MongoDB ID**, and **strict guarantee that the original post remains 100% unchanged**.

---

## 📡 API Reference Documentation

All endpoints return standardized JSON structures:

**Success Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation description",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": ["Specific validation detail"]
}
```

---

### 1. Authentication APIs

#### `POST /auth/register`
- **Access**: Public
- **Description**: Registers a new author account. Forces role to `user`.
- **Request Body**:
  ```json
  {
    "name": "Itachi Uchiha",
    "email": "itachi@akatsuki.dev",
    "password": "Mangekyo@2026"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "672005a76e0b741234567890",
        "name": "Itachi Uchiha",
        "email": "itachi@akatsuki.dev",
        "role": "user",
        "createdAt": "2026-10-28T00:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `POST /auth/login`
- **Access**: Public
- **Description**: Authenticates user credentials and returns a signed JWT.
- **Request Body**:
  ```json
  {
    "email": "itachi@akatsuki.dev",
    "password": "Mangekyo@2026"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "672005a76e0b741234567890",
        "name": "Itachi Uchiha",
        "email": "itachi@akatsuki.dev",
        "role": "user"
      },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```

#### `GET /auth/me`
- **Access**: Private (`Bearer <token>`)
- **Description**: Retrieves current authenticated user profile.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User profile retrieved successfully",
    "data": {
      "user": {
        "id": "672005a76e0b741234567890",
        "name": "Itachi Uchiha",
        "email": "itachi@akatsuki.dev",
        "role": "user"
      }
    }
  }
  ```

---

### 2. User Post Management APIs

#### `POST /posts`
- **Access**: Private (`Bearer <token>`)
- **Headers**: `Content-Type: application/json` or `multipart/form-data`
- **Description**: Create an article. Submitting for publishing sets `status: "pending"`. Specifying `"status": "draft"` saves it as a private draft.
- **Request Body**:
  ```json
  {
    "title": "The Nature of Reality",
    "description": "An inquiry into perceptions and truth.",
    "content": "People live their lives bound by what they accept as correct...",
    "category": "Philosophy",
    "status": "pending"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Post submitted successfully and is awaiting admin approval",
    "data": {
      "_id": "67200a123e0b741234567891",
      "title": "The Nature of Reality",
      "description": "An inquiry into perceptions and truth.",
      "content": "People live their lives bound by what they accept as correct...",
      "category": "Philosophy",
      "status": "pending",
      "createdBy": {
        "_id": "672005a76e0b741234567890",
        "name": "Itachi Uchiha",
        "email": "itachi@akatsuki.dev"
      },
      "createdAt": "2026-10-28T00:05:00.000Z"
    }
  }
  ```

#### `GET /posts`
- **Access**: Public
- **Description**: Public feed. **Only** returns articles where `status: "approved"`.
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `category` (optional filter)
  - `search` (optional keyword search in title & description)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Public approved posts retrieved successfully",
    "data": {
      "posts": [ ... ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 1,
        "totalPosts": 1,
        "limit": 10
      }
    }
  }
  ```

#### `GET /posts/:id`
- **Access**: Public
- **Description**: Retrieves an approved post by MongoDB ID. Returns `404` if the post does not exist or has not been approved.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Post retrieved successfully",
    "data": {
      "_id": "67200a123e0b741234567891",
      "title": "The Nature of Reality",
      "status": "approved",
      "createdBy": { ... }
    }
  }
  ```

#### `GET /posts/my-posts`
- **Access**: Private (`Bearer <token>`)
- **Description**: Retrieves all posts authored by the logged-in user, including drafts, pending, approved, and rejected.
- **Query Parameters**: `status` (optional filter, e.g. `?status=draft`)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Your posts retrieved successfully",
    "data": {
      "posts": [ ... ],
      "pagination": { ... }
    }
  }
  ```

#### `PATCH /posts/:id`
- **Access**: Private (Author only)
- **Description**: Updates author's post. If an approved post is edited, **its status automatically reverts to `pending`** to ensure changes undergo admin review.
- **Request Body**:
  ```json
  {
    "title": "The Nature of Reality (Revised)",
    "content": "Updated content with additional insights."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Post updated successfully",
    "data": {
      "_id": "67200a123e0b741234567891",
      "title": "The Nature of Reality (Revised)",
      "status": "pending"
    }
  }
  ```

#### `DELETE /posts/:id`
- **Access**: Private (Author or Admin)
- **Description**: Deletes the specified post.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Post deleted successfully",
    "data": {
      "deletedPostId": "67200a123e0b741234567891"
    }
  }
  ```

---

### 3. Admin Post Approval APIs

All admin routes require an authenticated user with `role: "admin"`. Normal users receive `403 Forbidden`.

#### `GET /admin/posts/pending`
- **Access**: Private (`Bearer <adminToken>`)
- **Description**: Retrieves all posts awaiting approval (`status: "pending"`).
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Pending posts retrieved successfully",
    "data": {
      "posts": [ ... ],
      "pagination": { ... }
    }
  }
  ```

#### `PATCH /admin/posts/approve/:id`
- **Access**: Private (`Bearer <adminToken>`)
- **Description**: Approves a post, setting `status: "approved"`. Makes it publicly visible.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Post approved successfully. It is now publicly visible.",
    "data": {
      "_id": "67200a123e0b741234567891",
      "status": "approved"
    }
  }
  ```

#### `PATCH /admin/posts/reject/:id`
- **Access**: Private (`Bearer <adminToken>`)
- **Description**: Rejects a post, setting `status: "rejected"`. Keeps it hidden from public view.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Post rejected successfully. It is hidden from public view.",
    "data": {
      "_id": "67200a123e0b741234567891",
      "status": "rejected"
    }
  }
  ```

---

### 4. Google Gemini AI Content Improvement API

#### `POST /ai/improve/:postId`
- **Access**: Private (Author only)
- **Description**: Sends the author's original article content to Google Gemini AI to enhance grammar, vocabulary, clarity, and narrative structure.
- **CRITICAL PRESERVATION GUARANTEE**:
  1. The original post is **never** modified, overwritten, or deleted.
  2. The improved content is saved as a **new Post document** with a **new MongoDB ID**.
  3. The new document is owned by the same user and assigned `status: "draft"`.
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Content successfully improved using Gemini AI and saved as a new draft. The original post remains intact.",
    "data": {
      "originalPostId": "67200a123e0b741234567891",
      "originalPostStatus": "draft",
      "newDraft": {
        "_id": "67200b893e0b741234567999",
        "title": "The Nature of Reality (AI Improved)",
        "description": "An inquiry into perceptions and truth.",
        "content": "Human existence is often constrained by what individuals accept as correct and absolute. This cognitive boundary defines their subjective reality...",
        "category": "Philosophy",
        "status": "draft",
        "createdBy": {
          "_id": "672005a76e0b741234567890",
          "name": "Itachi Uchiha",
          "email": "itachi@akatsuki.dev"
        },
        "createdAt": "2026-10-28T00:10:00.000Z"
      }
    }
  }
  ```

---

## 🖼️ File & Image Upload Details

- **Supported Formats**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`
- **Size Limit**: 5 MB (`5 * 1024 * 1024` bytes)
- **Safe Filenames**: Formatted as `<sanitized-name>-<timestamp>-<random-hash>.<ext>` to prevent path traversal and collisions.
- **Storage Location**: Stored locally in `/uploads` and served statically via `GET /uploads/<filename>`.
- **Production / Cloud Deployment**: For serverless environments (e.g., Vercel, AWS Lambda) or multi-instance containers, local disk storage is ephemeral. Replace `multer.diskStorage` with cloud storage adapters (such as AWS S3 or Cloudinary) by setting standard cloud SDK credentials in `.env`.

---

## 🛡️ Security Best Practices Implemented

1. **Password Security**: Strong salt hashing with `bcryptjs`. `select: false` prevents accidental exposure in queries. `toJSON` hook strips hashes from all outgoing JSON responses.
2. **Privilege Escalation Protection**: Public registration schema strictly filters out any request containing `role: "admin"`.
3. **Admin Review Bypass Protection**: If an author edits an already approved post, the system immediately demotes the status to `pending`, preventing unauthorized changes from going live without re-approval.
4. **JWT Verification**: Validates signature, expiration, and ensures the referenced user still exists before fulfilling requests.
5. **NoSQL Injection Defense**: Uses strict Mongoose schemas and validates all `req.params.id` using 24-character hexadecimal ObjectId matching.
6. **Centralized Error Sanitization**: Internal error details and stack traces are suppressed in production mode.

---

## 📮 Postman Collection Setup

1. Open **Postman**.
2. Click **Import** and select the file:
   `Akatsukis_Draft_API.postman_collection.json`
3. The collection includes pre-configured variables (`baseUrl`, `authToken`, `adminToken`, `postId`).
4. Running the **Register User** or **Login User** requests automatically saves the generated token to `authToken`.
5. Running the **Login Admin** request automatically saves the admin token to `adminToken`.

---

## 🔧 Common Troubleshooting & FAQ

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `EACCES` or `MongooseServerSelectionError` | MongoDB is not running or port is blocked | Ensure your MongoDB server is active, or use a MongoDB Atlas URI in `MONGODB_URI`. |
| `Gemini AI service is unavailable: GEMINI_API_KEY...` | Missing Gemini API Key in `.env` | Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and set `GEMINI_API_KEY` in `.env`. |
| `Access denied. Role 'user' is not authorized...` | A normal user tried to call `/admin/*` | Log in as an admin account or run `npm run seed:admin` to create one. |
| `Post not approved for public viewing` | Calling `GET /posts/:id` for draft/pending | The post must first be approved by an admin via `PATCH /admin/posts/approve/:id`. |

---

## 📜 Compliance & Verification Checklist

- [x] **Express.js & ES Modules**: Consistent `import`/`export`, `"type": "module"` in `package.json`.
- [x] **User Schema**: `name`, `email`, `password`, `role` (`user` / `admin`). Password hashed with `bcryptjs`, never returned.
- [x] **Post Schema**: `title`, `description`, `content`, `image`, `category`, `createdBy` (ref: User), `status`, `createdAt`.
- [x] **Auth Endpoints**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- [x] **User Post Endpoints**: `POST /posts`, `GET /posts` (approved only), `GET /posts/:id` (approved only), `GET /posts/my-posts`, `PATCH /posts/:id` (re-triggers review), `DELETE /posts/:id`.
- [x] **Admin Endpoints**: `GET /admin/posts/pending`, `PATCH /admin/posts/approve/:id`, `PATCH /admin/posts/reject/:id`.
- [x] **Gemini AI Integration**: `POST /ai/improve/:postId` uses official `@google/generative-ai`, creates new draft with new ID, preserves original post.
- [x] **Image Upload**: Multer with 5MB limit, type checks, safe unique names.
- [x] **Documentation & Testing**: Complete `.env.example`, Postman collection, 40 automated integration tests passing.
