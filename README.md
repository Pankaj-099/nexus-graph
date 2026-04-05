<div align="center">

# 🔗 Relationship Intelligence Platform

### A full-stack knowledge graph platform with AI-powered relationship extraction, real-time collaboration, and interactive graph visualization.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[Live Demo](#) · [API Docs](#) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🧠 Overview

**Relationship Intelligence Platform (RIP)** is a production-grade knowledge graph application that lets you build, visualize, and gain insights from complex relationship data. Unlike simple graph tools, RIP combines interactive visualization with AI-powered extraction, natural language querying, and real-time collaboration.

**Use cases:**
- Map organizational structures and team relationships
- Visualize skill networks and talent graphs
- Build knowledge bases from unstructured text
- Explore technology dependency graphs
- Analyze social and professional networks

---

## ✨ Features

### 🗄️ Data Management
- **Multi-format Import** — Upload JSON or CSV files with automatic parsing
- **Manual Entry** — Add nodes and edges through an intuitive UI
- **Schema Editor** — Define custom node and edge types with colors
- **Bulk Import Engine** — Deduplication, normalization, and validation
- **Multiple Projects** — Organize graphs into separate isolated projects

### 🌐 Graph Visualization
- **Interactive Canvas** — Pan, zoom, and explore with React Flow
- **Custom Node Styles** — Color-coded nodes by type with labels
- **Smart Layout** — Auto-positioning with grid and force layouts
- **MiniMap** — Bird's-eye view for large graphs
- **Filter & Search** — Real-time filtering by node type and name
- **Neighbor Expansion** — Click a node to highlight connected nodes

### 🤖 AI Features (Powered by Groq LLaMA3)
- **Relationship Extraction** — Paste any text, AI extracts nodes and edges automatically
- **Natural Language Query** — Ask questions like "Who knows React?" in plain English
- **Graph Insights** — AI-generated analysis, clusters, and recommendations
- **Auto-import** — Extracted entities go directly into your graph

### 📊 Analytics & Intelligence
- **Graph KPIs** — Node count, edge count, density, avg degree, orphan nodes
- **Most Connected** — Ranked list of hub nodes by connection count
- **Distribution Charts** — Node type and relationship type breakdowns
- **Path Finding** — BFS shortest path between any two nodes

### ⚡ Real-Time Collaboration
- **WebSocket Live Updates** — See changes instantly when collaborators add nodes
- **User Presence** — Know who else is viewing your graph
- **Live Indicator** — Green dot shows active WebSocket connection
- **Auto-reconnect** — Seamless reconnection on network interruption

### 🗺️ History & Diff
- **Graph Snapshots** — Save the state of your graph at any point in time
- **Visual Diff** — Compare two snapshots to see exactly what changed
- **Change Summary** — Nodes added, removed, modified at a glance
- **Timeline View** — Chronological history of all snapshots

### 🔗 Sharing & Access Control
- **Shareable Links** — One-click public URLs for read-only graph sharing
- **Embed Code** — iframe snippet for embedding graphs in websites
- **Public/Private Toggle** — Control access per project
- **No-login Viewer** — Public graphs viewable without an account

### 🔌 External REST API
- **Full CRUD API** — Programmatically manage nodes and edges
- **Bearer Auth** — Use your login token for API access
- **Interactive Docs** — Built-in API documentation with code examples
- **Python & JS snippets** — Ready-to-use code for integration

### 📋 Activity Logs
- **Timeline View** — Beautiful chronological activity feed
- **Action Tracking** — Logins, project creation, node/edge operations
- **Per-project Logs** — Filter activity by project

### 📤 Export
- **JSON Export** — Download complete graph data as structured JSON
- **Graph Snapshot** — Save and restore graph states

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Graph UI** | React Flow | Interactive graph canvas |
| **State** | Zustand | Client state management |
| **Data Fetching** | TanStack Query | Server state & caching |
| **HTTP** | Axios | API communication |
| **Real-time** | WebSockets (native) | Live collaboration |
| **Backend** | FastAPI (Python) | REST API & WebSockets |
| **Database** | PostgreSQL + SQLAlchemy | Persistent storage |
| **Auth** | JWT (python-jose + bcrypt) | Authentication |
| **AI** | Groq API (LLaMA3-70B) | Relationship extraction & NLQ |
| **Migrations** | Alembic | Database schema versioning |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Dashboard → ProjectView → GraphExplorer → Analytics │
│              HistoryPage → SharedGraph               │
└──────────────────────┬──────────────────────────────┘
                       │ REST API + WebSockets
┌──────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI)                   │
│                                                      │
│  /api/auth        → JWT Authentication               │
│  /api/projects    → Project CRUD                     │
│  /api/projects/   → Graph CRUD + Import              │
│    {id}/graph                                        │
│  /api/projects/   → Search + Neighbors               │
│    {id}/search                                       │
│  /api/projects/   → AI Extraction + NLQ              │
│    {id}/ai                                           │
│  /api/projects/   → KPIs + Path Finding              │
│    {id}/analytics                                    │
│  /api/projects/   → Snapshots + Diff                 │
│    {id}/history                                      │
│  /api/activity    → Activity Logs                    │
│  /api/public/     → Public Graph Access              │
│  /api/v1/         → External REST API                │
│  /ws/projects/    → WebSocket Real-time              │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               PostgreSQL Database                    │
│                                                      │
│  users            projects         nodes             │
│  edges            schema_defs      graph_snapshots   │
│  activity_logs                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/relationship-intelligence-platform.git
cd relationship-intelligence-platform
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Fill in your values in .env
```

### 3. Database Setup

```bash
# In PostgreSQL
psql -U postgres
CREATE USER ripuser WITH PASSWORD 'yourpassword';
CREATE DATABASE ripdb OWNER ripuser;
GRANT ALL PRIVILEGES ON DATABASE ripdb TO ripuser;
\q
```

### 4. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in your values
```

### 6. Start Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend `.env`

```env
# App
APP_NAME=Relationship Intelligence Platform
DEBUG=True
SECRET_KEY=your-super-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database
DATABASE_URL=postgresql://ripuser:yourpassword@localhost/ripdb

# AI (get free key at console.groq.com)
GROQ_API_KEY=gsk_your_groq_key_here

# Optional
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📡 API Reference

### Authentication

```http
POST /api/auth/register    # Create account
POST /api/auth/login       # Login → returns JWT
POST /api/auth/refresh     # Refresh token
GET  /api/auth/me          # Current user
```

### Projects

```http
GET    /api/projects           # List projects
POST   /api/projects           # Create project
GET    /api/projects/{id}      # Get project
PATCH  /api/projects/{id}      # Update project
DELETE /api/projects/{id}      # Delete project
POST   /api/projects/{id}/share  # Toggle public/private
```

### Graph

```http
GET    /api/projects/{id}/graph               # Get graph data
POST   /api/projects/{id}/graph/nodes         # Add node
PATCH  /api/projects/{id}/graph/nodes/{nid}   # Update node
DELETE /api/projects/{id}/graph/nodes/{nid}   # Delete node
POST   /api/projects/{id}/graph/edges         # Add edge
DELETE /api/projects/{id}/graph/edges/{eid}   # Delete edge
POST   /api/projects/{id}/graph/import/json   # Import JSON
POST   /api/projects/{id}/graph/import/csv    # Import CSV
DELETE /api/projects/{id}/graph/clear         # Clear graph
GET    /api/projects/{id}/graph/schema        # Get schema
POST   /api/projects/{id}/graph/schema        # Add schema type
```

### AI & Analytics

```http
POST /api/projects/{id}/ai/extract      # Extract from text
POST /api/projects/{id}/ai/query        # Natural language query
GET  /api/projects/{id}/ai/insights     # AI insights
GET  /api/projects/{id}/analytics/kpis  # Graph KPIs
GET  /api/projects/{id}/analytics/path  # Shortest path
```

### External API (v1)

```http
GET    /api/v1/projects                           # List projects
GET    /api/v1/projects/{id}/graph                # Get graph
POST   /api/v1/projects/{id}/nodes                # Add node
POST   /api/v1/projects/{id}/edges                # Add edge
POST   /api/v1/projects/{id}/import               # Bulk import
DELETE /api/v1/projects/{id}/nodes/{external_id}  # Delete node
```

### Public

```http
GET /api/public/{share_token}         # Get public graph
GET /api/public/{share_token}/embed   # Get embed config
```

---

## 📁 Project Structure

```
relationship-intelligence-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── projects.py      # Project CRUD
│   │   │   ├── graph.py         # Graph data management
│   │   │   ├── search.py        # Search & neighbor queries
│   │   │   ├── ai.py            # AI extraction & NLQ
│   │   │   ├── analytics.py     # KPIs & path finding
│   │   │   ├── history.py       # Snapshots & diff
│   │   │   ├── activity.py      # Activity logs
│   │   │   ├── public.py        # Public graph access
│   │   │   ├── external_api.py  # External REST API v1
│   │   │   └── ws.py            # WebSocket endpoint
│   │   ├── core/
│   │   │   ├── config.py        # Settings
│   │   │   ├── database.py      # Async DB connection
│   │   │   ├── security.py      # JWT + bcrypt
│   │   │   └── dependencies.py  # FastAPI dependencies
│   │   ├── models/
│   │   │   ├── user.py          # User table
│   │   │   ├── project.py       # Project table
│   │   │   └── graph.py         # Nodes, Edges, Snapshots
│   │   ├── schemas/             # Pydantic validators
│   │   ├── services/
│   │   │   ├── ai/extractor.py  # Groq AI service
│   │   │   ├── analytics/kpi.py # KPI calculations
│   │   │   └── graph/           # Graph engine & diff
│   │   ├── websockets/
│   │   │   └── manager.py       # WebSocket connections
│   │   └── main.py              # FastAPI app entry
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/                 # Axios API clients
        │   ├── client.ts        # Axios + JWT interceptor
        │   ├── projects.ts
        │   ├── graph.ts
        │   ├── search.ts
        │   ├── ai.ts
        │   ├── history.ts
        │   └── activity.ts
        ├── components/
        │   ├── ui/              # Button, Input, Card, Modal
        │   ├── graph/           # CustomNode, FilterPanel, NodePanel
        │   └── dashboard/       # KPICard
        ├── hooks/
        │   ├── useAuth.ts
        │   └── useWebSocket.ts
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── ProjectView.tsx
        │   ├── GraphExplorer.tsx
        │   ├── AnalyticsPage.tsx
        │   ├── HistoryPage.tsx
        │   ├── SharedGraph.tsx
        │   ├── ActivityPage.tsx
        │   └── ApiDocsPage.tsx
        ├── store/               # Zustand state
        └── types/               # TypeScript interfaces
```

---

## 🗺️ Roadmap

- [ ] Graph collaboration (multi-cursor)
- [ ] Automatic layout algorithms (force-directed, hierarchical)
- [ ] Graph templates library
- [ ] CSV export
- [ ] Webhook support
- [ ] Graph versioning with rollback
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom relationship logic

---

<div align="center">

Built with ❤️ using FastAPI, React, and PostgreSQL

⭐ Star this repo if you found it helpful!

</div>