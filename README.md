# Innovatech Server

Backend API for the Innovatech learning platform. Built with [Hono](https://hono.dev/), [Prisma](https://www.prisma.io/), and PostgreSQL.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Courses & Lessons](#courses--lessons)
  - [Practices](#practices)
  - [Manifests](#manifests)
- [Query Parameters](#query-parameters)
- [Error Handling](#error-handling)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (Bun compatible) |
| Framework | Hono 4.x |
| ORM | Prisma 7.x |
| Database | PostgreSQL |
| Auth | JWT (HS256 via jose) + bcryptjs |
| Validation | Zod 4.x |
| Rate Limiting | hono-rate-limiter |

---

## Getting Started

```sh
# Install dependencies
bun install

# Set up environment variables (see below)
cp .env.example .env   # or create .env manually

# Run database migrations and generate Prisma client
bun run db

# Start development server (with hot-reload)
bun run dev
```

Server starts at **http://localhost:9999** (or the port defined in `PORT`).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `APP_SECRET` | No | `abc123xyz` | JWT signing secret |
| `PORT` | No | `9999` | Server port |
| `FRONTEND_URL` | No | — | Allowed CORS origin |
| `NODE_ENV` | No | — | Set to `production` to disable debug logging |

---

## Authentication

All endpoints except **Auth** and **GET /manifests/active** require a Bearer token.

**Header format:**
```
Authorization: Bearer <token>
```

**How to obtain a token:** `POST /api/v1/auth/login`

Tokens expire in **5 hours**.

---

## API Reference

Base URL: **`/api/v1`**

### Auth

Public endpoints for admin registration and login.

---

#### `POST /auth/register`

Register a new admin account.

**Request Body:**

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response** `201 Created`:

```json
{
  "id": "a1b2c3d4-...",
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "$2a$10$...hashed..."
}
```

---

#### `POST /auth/login`

Authenticate and receive a JWT token.

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response** `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "admin": {
    "id": "a1b2c3d4-...",
    "name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

**Error** `400 Bad Request`:

```json
{
  "message": "Invalid login combination"
}
```

---

### Users

Requires authentication.

---

#### `GET /users`

Retrieve all registered users.

**Response** `200 OK`:

```json
[
  {
    "id": "u1v2w3x4-...",
    "name": "Juan Dela Cruz",
    "class": "Grade 10 - A",
    "school": "Innovatech High School",
    "guardianName": "Maria Dela Cruz",
    "guardianEmail": "maria@email.com",
    "guardianPhone": "09171234567",
    "datetime": "2026-05-19T10:30:00.000Z"
  }
]
```

---

### Courses & Lessons

Requires authentication. Supports `?include` query parameter (see [Query Parameters](#query-parameters)).

---

#### `GET /courses`

List all courses. Without `?include`, only base fields are returned.

**Response** `200 OK` *(without `?include`)*:

```json
[
  {
    "id": "c1d2e3f4-...",
    "name": "Introduction to AI",
    "description": "Learn the fundamentals of artificial intelligence.",
    "imageUrl": "https://assets.example.com/ai-course.png"
  }
]
```

**Response** `200 OK` *(with `?include=lessons,practices`)*:

```json
[
  {
    "id": "c1d2e3f4-...",
    "name": "Introduction to AI",
    "description": "Learn the fundamentals of artificial intelligence.",
    "imageUrl": "https://assets.example.com/ai-course.png",
    "lessons": [
      {
        "id": "l1m2n3o4-...",
        "courseId": "c1d2e3f4-...",
        "title": "What is AI?",
        "summary": "A brief overview of artificial intelligence.",
        "content": "Artificial intelligence (AI) is...",
        "videoUrl": "https://videos.example.com/lesson1.mp4",
        "videoSize": "52428800",
        "videoHash": "sha256:abc123..."
      }
    ],
    "practices": [
      {
        "id": "p1q2r3s4-...",
        "courseId": "c1d2e3f4-...",
        "title": "AI Basics Quiz",
        "questions": [
          {
            "question": "What does AI stand for?",
            "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
            "correctAnswer": "Artificial Intelligence",
            "explanation": "AI stands for Artificial Intelligence."
          }
        ]
      }
    ]
  }
]
```

---

#### `GET /courses/:id`

Get a single course by ID.

**Response** `200 OK` *(without `?include`)*:

```json
{
  "id": "c1d2e3f4-...",
  "name": "Introduction to AI",
  "description": "Learn the fundamentals of artificial intelligence.",
  "imageUrl": "https://assets.example.com/ai-course.png"
}
```

**Response** `200 OK` *(with `?include=lessons,practices`)*:

```json
{
  "id": "c1d2e3f4-...",
  "name": "Introduction to AI",
  "description": "Learn the fundamentals of artificial intelligence.",
  "imageUrl": "https://assets.example.com/ai-course.png",
  "lessons": [
    {
      "id": "l1m2n3o4-...",
      "courseId": "c1d2e3f4-...",
      "title": "What is AI?",
      "summary": "A brief overview of artificial intelligence.",
      "content": "Artificial intelligence (AI) is...",
      "videoUrl": "https://videos.example.com/lesson1.mp4",
      "videoSize": "52428800",
      "videoHash": "sha256:abc123..."
    }
  ],
  "practices": [
    {
      "id": "p1q2r3s4-...",
      "courseId": "c1d2e3f4-...",
      "title": "AI Basics Quiz",
      "questions": [
        {
          "question": "What does AI stand for?",
          "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
          "correctAnswer": "Artificial Intelligence",
          "explanation": "AI stands for Artificial Intelligence."
        }
      ]
    }
  ]
}
```

---

#### `POST /courses`

Create a new course.

**Request Body:**

```json
{
  "name": "Introduction to AI",
  "description": "Learn the fundamentals of artificial intelligence.",
  "imageUrl": "https://assets.example.com/ai-course.png"
}
```

**Response** `201 Created`:

```json
{
  "id": "c1d2e3f4-...",
  "name": "Introduction to AI",
  "description": "Learn the fundamentals of artificial intelligence.",
  "imageUrl": "https://assets.example.com/ai-course.png"
}
```

---

#### `PATCH /courses/:id`

Update an existing course. All fields are optional.

**Request Body:**

```json
{
  "name": "Updated Course Name",
  "description": "Updated description."
}
```

**Response** `200 OK`:

```json
{
  "id": "c1d2e3f4-...",
  "name": "Updated Course Name",
  "description": "Updated description.",
  "imageUrl": "https://assets.example.com/ai-course.png"
}
```

---

#### `DELETE /courses/:id`

Delete a course. Cascades to its lessons and practices.

**Response** `200 OK`:

```json
{
  "message": "Course deleted"
}
```

---

#### `GET /courses/:id/lessons`

Get all lessons for a course.

**Response** `200 OK` *(without `?include`)*:

```json
[
  {
    "id": "l1m2n3o4-...",
    "courseId": "c1d2e3f4-...",
    "title": "What is AI?",
    "summary": "A brief overview of artificial intelligence.",
    "content": "Artificial intelligence (AI) is...",
    "videoUrl": "https://videos.example.com/lesson1.mp4",
    "videoSize": "52428800",
    "videoHash": "sha256:abc123..."
  }
]
```

**Response** `200 OK` *(with `?include=course`)*:

```json
[
  {
    "id": "l1m2n3o4-...",
    "courseId": "c1d2e3f4-...",
    "title": "What is AI?",
    "summary": "A brief overview of artificial intelligence.",
    "content": "Artificial intelligence (AI) is...",
    "videoUrl": "https://videos.example.com/lesson1.mp4",
    "videoSize": "52428800",
    "videoHash": "sha256:abc123...",
    "course": {
      "id": "c1d2e3f4-...",
      "name": "Introduction to AI",
      "description": "Learn the fundamentals of artificial intelligence.",
      "imageUrl": "https://assets.example.com/ai-course.png"
    }
  }
]
```

---

#### `POST /courses/:id/lessons`

Create a lesson under a course.

**Request Body:**

```json
{
  "courseId": "c1d2e3f4-...",
  "title": "Introduction to Neural Networks",
  "summary": "Understanding how neural networks work.",
  "content": "A neural network is a series of algorithms...",
  "videoUrl": "https://videos.example.com/neural.mp4",
  "videoSize": "104857600",
  "videoHash": "sha256:def456..."
}
```

**Response** `201 Created`:

```json
{
  "id": "l5m6n7o8-...",
  "courseId": "c1d2e3f4-...",
  "title": "Introduction to Neural Networks",
  "summary": "Understanding how neural networks work.",
  "content": "A neural network is a series of algorithms...",
  "videoUrl": "https://videos.example.com/neural.mp4",
  "videoSize": "104857600",
  "videoHash": "sha256:def456..."
}
```

---

#### `PATCH /courses/:id/lessons`

Update a lesson. Requires `id` in the request body to identify the lesson.

**Request Body:**

```json
{
  "id": "l1m2n3o4-...",
  "title": "Updated Lesson Title",
  "summary": "Updated summary."
}
```

**Response** `200 OK`:

```json
{
  "id": "l1m2n3o4-...",
  "courseId": "c1d2e3f4-...",
  "title": "Updated Lesson Title",
  "summary": "Updated summary.",
  "content": "Artificial intelligence (AI) is...",
  "videoUrl": "https://videos.example.com/lesson1.mp4",
  "videoSize": "52428800",
  "videoHash": "sha256:abc123..."
}
```

---

#### `DELETE /courses/:id/lessons`

Delete a lesson. Requires `id` in the request body.

**Request Body:**

```json
{
  "id": "l1m2n3o4-..."
}
```

**Response** `200 OK`:

```json
{
  "message": "Lesson deleted"
}
```

---

### Practices

Requires authentication.

---

#### `GET /practices`

List all practices.

**Response** `200 OK` *(without `?include`)*:

```json
[
  {
    "id": "p1q2r3s4-...",
    "courseId": "c1d2e3f4-...",
    "title": "AI Basics Quiz",
    "questions": [
      {
        "question": "What does AI stand for?",
        "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
        "correctAnswer": "Artificial Intelligence",
        "explanation": "AI stands for Artificial Intelligence."
      }
    ]
  }
]
```

**Response** `200 OK` *(with `?include=course`)*:

```json
[
  {
    "id": "p1q2r3s4-...",
    "courseId": "c1d2e3f4-...",
    "title": "AI Basics Quiz",
    "questions": [
      {
        "question": "What does AI stand for?",
        "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
        "correctAnswer": "Artificial Intelligence",
        "explanation": "AI stands for Artificial Intelligence."
      }
    ],
    "course": {
      "id": "c1d2e3f4-...",
      "name": "Introduction to AI",
      "description": "Learn the fundamentals of artificial intelligence.",
      "imageUrl": "https://assets.example.com/ai-course.png"
    }
  }
]
```

---

#### `POST /practices`

Create a new practice with questions.

**Request Body:**

```json
{
  "title": "AI Basics Quiz",
  "courseId": "c1d2e3f4-...",
  "questions": [
    {
      "question": "What does AI stand for?",
      "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
      "correctAnswer": "Artificial Intelligence",
      "explanation": "AI stands for Artificial Intelligence, the simulation of human intelligence by machines."
    },
    {
      "question": "Who is considered the father of AI?",
      "options": ["Alan Turing", "John McCarthy", "Elon Musk", "Stephen Hawking"],
      "correctAnswer": "John McCarthy",
      "explanation": "John McCarthy coined the term 'Artificial Intelligence' in 1956."
    }
  ]
}
```

**Note:** `courseId` is optional (omit for standalone practices).

**Response** `200 OK`:

```json
{
  "id": "p1q2r3s4-...",
  "courseId": "c1d2e3f4-...",
  "title": "AI Basics Quiz",
  "questions": [
    {
      "question": "What does AI stand for?",
      "options": ["Artificial Intelligence", "Automated Input", "Artificial Integration", "Automated Intelligence"],
      "correctAnswer": "Artificial Intelligence",
      "explanation": "AI stands for Artificial Intelligence, the simulation of human intelligence by machines."
    }
  ]
}
```

---

#### `PATCH /practices/:id`

Update a practice.

**Request Body:**

```json
{
  "title": "Updated Quiz Title",
  "questions": [
    {
      "question": "Updated question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Updated explanation."
    }
  ]
}
```

**Response** `200 OK`:

```json
{
  "id": "p1q2r3s4-...",
  "courseId": "c1d2e3f4-...",
  "title": "Updated Quiz Title",
  "questions": [
    {
      "question": "Updated question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Updated explanation."
    }
  ]
}
```

---

#### `DELETE /practices/:id`

Delete a practice.

**Response** `200 OK`:

```json
{
  "message": "Practice Deleted"
}
```

---

### Manifests

**`GET /manifests/active` is public.** All other manifest endpoints require authentication.

A Manifest represents a deployable application version with its AI model metadata.

---

#### `GET /manifests/active` *(public)*

Get the currently active manifest.

**Response** `200 OK`:

```json
{
  "id": "m1n2o3p4-...",
  "name": "Innovatech App v2.1.0",
  "version": "2.1.0",
  "hash": "sha256:abc123def456...",
  "url": "https://releases.example.com/innovatech-v2.1.0.apk",
  "appSize": "52428800",
  "innovaiModelTagName": "v1.0.0",
  "innovaiModelSize": "104857600",
  "innovaiModelHash": "sha256:xyz789...",
  "active": true,
  "datetime": "2026-05-19T12:00:00.000Z"
}
```

**Error** `404 Not Found`:

```json
{
  "message": "No active manifest"
}
```

---

#### `GET /manifests`

List all manifests.

**Response** `200 OK`:

```json
[
  {
    "id": "m1n2o3p4-...",
    "name": "Innovatech App v2.1.0",
    "version": "2.1.0",
    "hash": "sha256:abc123...",
    "url": "https://releases.example.com/innovatech-v2.1.0.apk",
    "appSize": "52428800",
    "innovaiModelTagName": "v1.0.0",
    "innovaiModelSize": "104857600",
    "innovaiModelHash": "sha256:xyz789...",
    "active": true,
    "datetime": "2026-05-19T12:00:00.000Z"
  }
]
```

---

#### `POST /manifests`

Create a new manifest.

**Request Body:**

```json
{
  "name": "Innovatech App v2.2.0",
  "version": "2.2.0",
  "hash": "sha256:newhash123...",
  "url": "https://releases.example.com/innovatech-v2.2.0.apk",
  "appSize": "55000000",
  "innovaiModelTagName": "v1.1.0",
  "innovaiModelSize": "110000000",
  "innovaiModelHash": "sha256:newmodelhash..."
}
```

**Response** `200 OK`:

```json
{
  "id": "m5n6o7p8-...",
  "name": "Innovatech App v2.2.0",
  "version": "2.2.0",
  "hash": "sha256:newhash123...",
  "url": "https://releases.example.com/innovatech-v2.2.0.apk",
  "appSize": "55000000",
  "innovaiModelTagName": "v1.1.0",
  "innovaiModelSize": "110000000",
  "innovaiModelHash": "sha256:newmodelhash...",
  "active": false,
  "datetime": "2026-05-19T14:00:00.000Z"
}
```

---

#### `PATCH /manifests/:id`

Activate a manifest. Deactivates all other manifests automatically.

**Response** `200 OK`:

```json
{
  "id": "m5n6o7p8-...",
  "name": "Innovatech App v2.2.0",
  "version": "2.2.0",
  "hash": "sha256:newhash123...",
  "url": "https://releases.example.com/innovatech-v2.2.0.apk",
  "appSize": "55000000",
  "innovaiModelTagName": "v1.1.0",
  "innovaiModelSize": "110000000",
  "innovaiModelHash": "sha256:newmodelhash...",
  "active": true,
  "datetime": "2026-05-19T14:00:00.000Z"
}
```

---

#### `DELETE /manifests/:id`

Delete a manifest.

**Response** `200 OK`:

```json
{
  "message": "Manifest deleted"
}
```

---

## Query Parameters

### `?include`

Courses, lessons, and practices support eager-loading of related records.

| Value | Description |
|-------|-------------|
| `lessons` | Include lessons in course responses |
| `practices` | Include practices in course responses |
| `course` | Include parent course in lesson/practice responses |
| `lessons.course` | Nested include — lessons with their course |

**Examples:**
```
GET /api/v1/courses?include=lessons,practices
GET /api/v1/courses/:id/lessons?include=course
GET /api/v1/practices?include=course
```

---

## Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register new admin |
| `POST` | `/auth/login` | — | Login, get JWT |
| `GET` | `/user` | Yes | List all users |
| `GET` | `/courses` | Yes | List courses |
| `GET` | `/courses/:id` | Yes | Get course by ID |
| `POST` | `/courses` | Yes | Create course |
| `PATCH` | `/courses/:id` | Yes | Update course |
| `DELETE` | `/courses/:id` | Yes | Delete course |
| `GET` | `/courses/:id/lessons` | Yes | Get lessons by course |
| `POST` | `/courses/:id/lessons` | Yes | Create lesson |
| `PATCH` | `/courses/:id/lessons` | Yes | Update lesson |
| `DELETE` | `/courses/:id/lessons` | Yes | Delete lesson |
| `GET` | `/practices` | Yes | List practices |
| `POST` | `/practices` | Yes | Create practice |
| `PATCH` | `/practices/:id` | Yes | Update practice |
| `DELETE` | `/practices/:id` | Yes | Delete practice |
| `GET` | `/manifests/active` | — | Get active manifest |
| `GET` | `/manifests` | Yes | List manifests |
| `POST` | `/manifests` | Yes | Create manifest |
| `PATCH` | `/manifests/:id` | Yes | Activate manifest |
| `DELETE` | `/manifests/:id` | Yes | Delete manifest |

---

## Error Handling

Standard error response format:

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (invalid token payload) |
| `404` | Resource not found |
| `409` | Conflict (duplicate record) |
| `500` | Internal server error |

### Prisma Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `P2002` | 409 | Unique constraint violation |
| `P2025` / `P2001` | 404 | Record not found |
| `P2003` | 400 | Invalid foreign key reference |
| `P2011` / `P2012` | 400 | Missing required field |

---

## Rate Limiting

- **Window:** 60 seconds
- **Limit:** 100 requests per window
- **Keyed by:** `Authorization` header value (or `"anonymous"` for unauthenticated requests)

---

## Development

```sh
# Watch mode (auto-restart on file changes)
bun run dev

# TypeScript compilation
bun run build

# Run migrations + generate client + push schema
bun run db
```
