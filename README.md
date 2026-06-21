# OA Engine

A full-stack coding workspace for practicing Online Assessment (OA) problems. Paste any problem description, let AI parse it into a structured format with 30+ test cases, write your solution in a built-in code editor, and run it against all test cases — all in one place.

**Live:** [https://oa-engine.vercel.app](https://oa-engine.vercel.app)

## Features

### Problem Management
- **AI-Powered Problem Parsing** — Paste raw problem text (from LeetCode, HackerRank, etc.) and AI automatically generates a structured JSON with title, description, examples, constraints, starter code in multiple languages, and **30+ test cases**.
- **Add Problem Flow** — Available from both the Home page and Problems page. Includes duplicate detection (by slug and title) and AI legitimacy verification before saving.
- **Problem Database** — All problems are stored in a Neon Postgres database with full CRUD support.
- **Admin Controls** — Admin users can delete problems and edit company tags directly from the problem description view.
- **Company Tags** — Tag problems with company names (Google, Meta, Amazon, etc.) to track which companies ask which questions.

### Code Editor & Execution
- **Monaco Editor** — Full VS Code-quality editor with syntax highlighting, IntelliSense, and configurable settings.
- **Multi-Language Support** — Write and run solutions in:
  - C++ (GCC)
  - Python (3.11)
  - JavaScript (Node.js)
  - Java (OpenJDK 21)
- **Code Execution** — Code is compiled and executed remotely via Wandbox API. Supports custom test case input and batch submission against all stored test cases.
- **C++ to JS Transpiler** — Built-in transpiler that converts C++ Solution classes to executable JavaScript for local preview runs.
- **Data Structure Support** — Full support for `ListNode` (linked lists) and `TreeNode` (binary trees) across all languages, with automatic serialization/deserialization.
- **Run vs Submit** — Run executes against a single custom input. Submit runs against all stored test cases and reports pass/fail with the first failing case details.

### Workspace
- **Split-Pane Layout** — Left panel for problem description or JSON input, right panel for the code editor with a collapsible console drawer.
- **Problem Description View** — Rendered HTML description with examples, constraints, follow-up questions, tags, and company associations.
- **JSON Input** — Paste raw JSON to load a problem directly, or use the AI tab to paste unstructured text and have it parsed automatically.
- **Console Drawer** — Collapsible panel showing test case input, execution results, runtime, memory, and error details with diff between expected and actual output.

### Pages
- **Home** (`/`) — Dashboard with problem statistics (total, easy, medium, hard counts), quick navigation cards, and Add Problem button.
- **Problems** (`/problems`) — Clean list view of all stored problems with difficulty, tags, company badges, and solve links.
- **Workspace** (`/workspace`) — The main coding environment. Loads problems via query params (`?problem=slug`) or JSON input.
- **Profile** (`/profile`) — User profile with avatar, email, join date, progress ring, difficulty breakdown bars, and a problem explorer.

### Authentication
- **Clerk Integration** — Full authentication with sign-in, sign-up, and session management via Clerk.
- **Admin Role** — Admin access is granted based on email address. Admins can delete problems and manage company tags.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Font | [Poppins](https://fonts.google.com/specimen/Poppins) (via `next/font/google`) |
| Database | [Neon Postgres](https://neon.tech) with [Prisma ORM](https://prisma.io) |
| Auth | [Clerk](https://clerk.com) |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) (via `@monaco-editor/react`) |
| Code Execution | [Wandbox API](https://wandbox.org) |
| AI | [NVIDIA NIM API](https://build.nvidia.com) (LLaMA 3.1 70B for generation, 8B for verification) |
| Icons | [Lucide React](https://lucide.dev) |

## Project Structure

```
prisma/
└── schema.prisma                    # Prisma database schema definition
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts        # AI problem parsing endpoint
│   │   ├── problems/
│   │   │   ├── route.ts             # GET all problems, POST new problem
│   │   │   ├── verify/route.ts      # Duplicate check + AI legitimacy verification
│   │   │   └── [slug]/route.ts      # GET/PUT/DELETE individual problem
│   │   └── run/route.ts             # Code compilation & execution endpoint
│   ├── problems/page.tsx            # Problems list page
│   ├── profile/page.tsx             # User profile page
│   ├── workspace/page.tsx           # Main coding workspace
│   ├── page.tsx                     # Home dashboard
│   ├── layout.tsx                   # Root layout with Clerk provider
│   ├── globals.css                  # Global styles and CSS variables
│   ├── runner.ts                    # C++ to JS transpiler and local runner
│   └── types.ts                     # TypeScript interfaces
├── components/
│   ├── AddProblemButton.tsx         # Add Problem button (card + inline variants)
│   ├── AddProblemModal.tsx          # Multi-step modal: paste → verify → generate → save
│   ├── CodeEditor.tsx               # Monaco editor with run/submit and console drawer
│   ├── DeleteProblemButton.tsx      # Admin delete button with confirmation
│   ├── JSONInput.tsx                # JSON input panel with AI parsing tab
│   ├── Navbar.tsx                   # Top navigation bar
│   └── ProblemDescription.tsx       # Problem description renderer with company editing
├── lib/
│   ├── auth.ts                      # Admin authorization helper
│   ├── db.ts                        # Prisma client instantiation helper
│   └── sanitizeProblem.ts           # HTML sanitization for problem descriptions
└── proxy.ts                         # Clerk middleware configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database
- A [Clerk](https://clerk.com) application
- An [NVIDIA NIM](https://build.nvidia.com) API key

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://..."
NVIDIA_API_KEY="nvapi-..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

### Install & Run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems` | List all problems |
| `POST` | `/api/problems` | Create a new problem (with duplicate detection) |
| `GET` | `/api/problems/[slug]` | Get full problem details |
| `PUT` | `/api/problems/[slug]` | Update company tags (admin only) |
| `DELETE` | `/api/problems/[slug]` | Delete a problem (admin only) |
| `POST` | `/api/problems/verify` | Check for duplicates + AI legitimacy verification |
| `POST` | `/api/generate` | AI-parse raw text into structured problem JSON |
| `POST` | `/api/run` | Compile and execute code against test cases |

## License

This project is private and not licensed for redistribution.
