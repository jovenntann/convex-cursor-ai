# Convex AI Project

A Next.js project integrated with Convex backend and Shadcn UI components.

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)

## 🚀 Quick Start

### 1. Install Global Dependencies

```bash
npm install -g convex
```

### 2. Project Setup

```bash
# Install project dependencies
npm install convex

# Start Convex development server
npx convex dev

# Start MCP (Mission Control Panel)
npx convex@latest mcp start
```

### 3. Next.js Setup

Follow the official [Convex Next.js Quick Start Guide](https://docs.convex.dev/quickstart/nextjs) to set up Next.js in the current directory.

### 4. Shadcn UI Integration

Install and configure Shadcn UI components ensuring Next.js compatibility.

## 🎛️ Convex MCP Features

### Deployment Management
- View all Convex deployments (development and production)
- Access deployment and dashboard URLs

### Database Operations
- Browse and query table data
- View table schemas
- Execute read-only database queries

### Function Management
- List and execute Convex functions (queries, mutations, actions)
- Access function metadata:
  - Identifiers
  - Argument validators
  - Return value validators
  - Function types
  - Visibility settings

### Environment Variables
- List all variables
- Get/Set variable values
- Remove variables

### Development Tools
- Execute sandboxed queries
- Debug database state
- Inspect schemas

## 🔄 Development Workflow

1. Start the Convex development server
2. Use MCP for backend development and testing
3. Implement frontend features with Next.js and Shadcn

## 📝 Feature Planning

### Task Management Implementation
Before writing code, plan the following aspects:
- Data schema design
- Required Convex functions
- UI components and layout
- State management approach

Use Convex MCP to:
- Test database queries
- Validate function behavior
- Monitor deployment status
