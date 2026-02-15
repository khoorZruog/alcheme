# Next.js Firebase AI Boilerplate

A production-ready Next.js boilerplate with Firebase Authentication, Firestore, Cloud Storage, and Vertex AI multi-agent workflows powered by Gemini 2.5 Flash.

## Features

- **Next.js 16** - Latest version with App Router and React Server Components
- **React 19** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS 4.1.4** - Modern styling with CSS-first configuration
- **shadcn/ui** - Beautiful, accessible UI components
- **Firebase Auth** - Email/Password + Google OAuth authentication
- **Cloud Firestore** - NoSQL database with real-time capabilities
- **Cloud Storage** - File storage and management
- **Vertex AI** - Gemini 2.5 Flash for AI-powered features
- **Multi-Agent Workflows** - Coordinator, Research, and Writer agents working together
- **Google Cloud Run** - Serverless deployment with Docker

## Prerequisites

Before you begin, ensure you have:

- Node.js 20+ installed
- A Firebase project ([Create one here](https://console.firebase.google.com/))
- A Google Cloud project with Vertex AI API enabled ([Enable here](https://console.cloud.google.com/))
- Firebase Admin SDK service account key
- Google Cloud service account key for Vertex AI

## Quick Start

### 1. Clone and Install

```bash
cd nextjs-firebase-ai-boilerplate
npm install
```

### 2. Configure Firebase

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** and add Email/Password and Google providers
4. Create a **Firestore Database** (start in test mode)
5. Enable **Storage**

#### Get Firebase Configuration

1. Go to Project Settings > General
2. Under "Your apps", click the web icon (</>)
3. Copy the Firebase configuration object

#### Get Firebase Admin SDK Credentials

1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `service-account-key.json` in the project root

### 3. Configure Google Cloud / Vertex AI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the Vertex AI API
4. Create a service account with Vertex AI User role
5. Download the service account key JSON

### 4. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Firebase Configuration (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your_project_id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-firebase-ai-boilerplate/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth routes (login, signup)
│   ├── (protected)/               # Protected routes (dashboard, agents)
│   ├── api/                       # API routes
│   │   └── ai/                    # AI endpoints
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── auth/                      # Authentication components
│   ├── ai/                        # AI workflow components
│   └── ui/                        # shadcn/ui components
├── lib/                           # Library code
│   ├── firebase/                  # Firebase utilities
│   │   ├── client.ts              # Client SDK
│   │   ├── admin.ts               # Admin SDK
│   │   ├── auth.ts                # Auth utilities
│   │   ├── firestore.ts           # Firestore utilities
│   │   └── storage.ts             # Storage utilities
│   └── vertexai/                  # Vertex AI
│       ├── client.ts              # Vertex AI client
│       └── agents/                # Multi-agent system
│           ├── types.ts           # Type definitions
│           ├── base-agent.ts      # Base agent class
│           ├── coordinator-agent.ts
│           ├── research-agent.ts
│           ├── writer-agent.ts
│           └── orchestrator.ts    # Workflow orchestration
├── types/                         # TypeScript types
├── middleware.ts                  # Next.js middleware (auth)
├── .env.example                   # Environment variables template
├── Dockerfile                     # Docker configuration
├── cloudbuild.yaml               # Cloud Build configuration
└── package.json                   # Dependencies
```

## Key Features Guide

### Authentication

The boilerplate includes Firebase Authentication with:

- **Email/Password** - Traditional authentication
- **Google OAuth** - Social login
- **Protected Routes** - Automatic redirection via middleware
- **Auth Context** - React context for user state

**Usage Example:**

```typescript
import { useAuth } from '@/components/auth/auth-provider';

export function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>Welcome {user.email}</div>;
}
```

### Firestore Database

CRUD operations with type safety:

```typescript
import { createDocument, getDocument, updateDocument } from '@/lib/firebase/firestore';

// Create
const id = await createDocument('users', { name: 'John', email: 'john@example.com' });

// Read
const user = await getDocument('users', id);

// Update
await updateDocument('users', id, { name: 'Jane' });
```

### Cloud Storage

File upload and management:

```typescript
import { uploadAndGetURL } from '@/lib/firebase/storage';

const file = event.target.files[0];
const url = await uploadAndGetURL(`uploads/${file.name}`, file);
```

### Multi-Agent AI Workflows

The boilerplate includes a complete multi-agent system:

1. **Coordinator Agent** - Plans and breaks down complex tasks
2. **Research Agent** - Gathers and analyzes information
3. **Writer Agent** - Creates polished content

**Example Workflow:**

```typescript
import { WorkflowOrchestrator } from '@/lib/vertexai/agents/orchestrator';

const orchestrator = new WorkflowOrchestrator();
const results = await orchestrator.executeWorkflow(
  "Research and write a blog post about renewable energy"
);
```

## Deployment

### Deploy to Google Cloud Run

#### Prerequisites

- Google Cloud CLI installed ([Install guide](https://cloud.google.com/sdk/docs/install))
- Docker installed
- Google Cloud project set up

#### Deploy Steps

1. **Authenticate with Google Cloud:**

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Build and deploy using Cloud Build:**

```bash
gcloud builds submit --config cloudbuild.yaml
```

3. **Set environment variables in Cloud Run:**

Go to Cloud Run console and add your environment variables in the service settings.

#### Manual Docker Deployment

```bash
# Build the Docker image
docker build -t nextjs-firebase-ai-boilerplate .

# Tag for Google Container Registry
docker tag nextjs-firebase-ai-boilerplate gcr.io/YOUR_PROJECT_ID/nextjs-firebase-ai-boilerplate

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/nextjs-firebase-ai-boilerplate

# Deploy to Cloud Run
gcloud run deploy nextjs-firebase-ai-boilerplate \
  --image gcr.io/YOUR_PROJECT_ID/nextjs-firebase-ai-boilerplate \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack Details

- **Framework:** Next.js 16.1.5
- **React:** 19.0.0
- **TypeScript:** 5.x
- **Styling:** Tailwind CSS 4.1.4
- **UI Components:** shadcn/ui (Radix UI)
- **Authentication:** Firebase Auth 11.1.0
- **Database:** Cloud Firestore
- **Storage:** Cloud Storage
- **AI:** Vertex AI with Gemini 2.5 Flash
- **Validation:** Zod 3.24.1
- **Icons:** Lucide React
- **Deployment:** Google Cloud Run

## Firebase Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /public/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Firebase Admin SDK Issues

If you encounter `FIREBASE_PRIVATE_KEY` formatting issues:

1. Ensure the private key is wrapped in double quotes
2. Use `\\n` for newlines in the `.env.local` file
3. The code automatically replaces `\\n` with actual newlines

### Vertex AI Authentication

If Vertex AI fails to authenticate:

1. Verify `GOOGLE_APPLICATION_CREDENTIALS` points to the correct service account key
2. Ensure the service account has "Vertex AI User" role
3. Check that the Vertex AI API is enabled in your Google Cloud project

### Next.js Build Errors

If the build fails:

1. Run `npm install` to ensure all dependencies are installed
2. Delete `.next` folder and rebuild
3. Check TypeScript errors with `npx tsc --noEmit`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions:
- Check existing issues in the repository
- Create a new issue with detailed description
- Include error logs and environment details

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Firebase](https://firebase.google.com/) and [Vertex AI](https://cloud.google.com/vertex-ai)
