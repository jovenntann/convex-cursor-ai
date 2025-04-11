# Integrating Convex with Clerk Authentication

This document explains how to integrate Convex (a real-time database) with Clerk (an authentication provider) in a Next.js application.

## Overview

This integration allows you to:
- Authenticate users with Clerk
- Store user data in Convex
- Create protected routes that require authentication
- Access user identity in Convex functions

## Project Structure

```
├── convex/
│   ├── _generated/       # Auto-generated Convex files
│   ├── schema.ts         # Database schema definition
│   └── users.ts          # User-related Convex functions
├── src/
│   ├── app/
│   │   ├── dashboard/    # Protected dashboard page
│   │   ├── sign-in/      # Clerk sign-in page
│   │   ├── sign-up/      # Clerk sign-up page
│   │   ├── layout.tsx    # Root layout with providers
│   │   ├── page.tsx      # Home page
│   │   └── provider.tsx  # Convex and Clerk provider setup
└── middleware.ts         # Route protection middleware
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install @clerk/nextjs convex
```

### 2. Configure Environment Variables

Create a `.env.local` file with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_ISSUER_DOMAIN=your_clerk_issuer_domain
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

### 3. Set Up Convex Schema

Define a schema for storing user data in `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    userId: v.string(),
    tokenIdentifier: v.string(),
    createdAt: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
});
```

### 4. Create Convex Functions for User Management

In `convex/users.ts`, add functions to get and store user data:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return identity;
  }
});

export const getUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();
  },
});

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the user details have changed, update them
      if (
        user.name !== identity.name ||
        user.email !== identity.email ||
        user.imageUrl !== (identity.imageUrl as string | undefined)
      ) {
        await ctx.db.patch(user._id, {
          name: identity.name,
          email: identity.email,
          imageUrl: identity.imageUrl as string | undefined,
        });
      }
      return user._id;
    }

    // If it's a new identity, create a new User
    return await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      imageUrl: identity.imageUrl as string | undefined,
      userId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      createdAt: new Date().toISOString(),
    });
  },
});
```

### 5. Initialize Convex

Run the Convex development server to generate the necessary files and start syncing with your Convex backend:

```bash
npx convex dev
```

This will:
- Create a Convex deployment if you don't have one already
- Generate TypeScript files in the `convex/_generated` directory
- Sync your schema and functions with the Convex cloud
- Set up environment variables in `.env.local`

Keep this running in a separate terminal while developing your application.

### 6. Configure TypeScript Path Aliases

To easily import Convex files in your application, update your `tsconfig.json` to include path aliases for the Convex directory:

```json
{
  "compilerOptions": {
    // ... other options
    "paths": {
      "@/*": ["./src/*"],
      "@convex/*": ["./convex/*"]
    }
  }
}
```

This allows you to import Convex files using `@convex/` instead of relative paths like `../../../convex/`.

### 7. Set Up Clerk and Convex Providers

Create a provider component in `src/app/provider.tsx`:

```tsx
"use client";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';

export default function Provider({ children }: { children: ReactNode }) {
  const convex = new ConvexReactClient(convexUrl);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

### 8. Configure Root Layout

Update `src/app/layout.tsx` to include the ClerkProvider and our custom Provider:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import Provider from "./provider";

export const metadata: Metadata = {
  title: "Convex + Clerk Demo",
  description: "A demo of Convex and Clerk integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Provider>
            {children}
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 9. Create Authentication Pages

Create sign-in and sign-up pages using Clerk components:

**Sign In Page** (`src/app/sign-in/[[...sign-in]]/page.tsx`):

```tsx
"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

**Sign Up Page** (`src/app/sign-up/[[...sign-up]]/page.tsx`):

```tsx
"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

### 10. Create Landing Page with Conditional Login/Dashboard Button

Update the home page to show login or dashboard button based on authentication status:

```tsx
"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-8">
      <h1 className="text-4xl font-bold text-center">
        Welcome to Convex + Clerk Demo
      </h1>
      <p className="text-xl text-center max-w-2xl">
        This is a simple demo showing the integration of Convex and Clerk for authentication and real-time data.
      </p>
      <div className="flex gap-4">
        {isLoaded && !isSignedIn && (
          <Link href="/sign-in">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
              Login
            </button>
          </Link>
        )}
        {isLoaded && isSignedIn && (
          <Link href="/dashboard">
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium">
              Go to Dashboard
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
```

### 11. Create Protected Dashboard Page

Create a dashboard page that shows user info and stores the user in Convex:

```tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";  // Using the path alias
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import Link from "next/link";

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getUser);
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isSignedIn && convexUser) {
      storeUser();
    }
  }, [isSignedIn, convexUser, storeUser]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">You need to sign in to access the dashboard</h1>
        <Link href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-8 gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
        <div>
          <p className="mb-2">
            <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}
          </p>
          <p className="mb-2">
            <strong>User ID:</strong> {user?.id}
          </p>
        </div>
        <div className="mt-4">
          <Link href="/" className="text-blue-500 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 12. Run the Application

Start your Next.js development server in a separate terminal:

```bash
npm run dev
```

Visit http://localhost:3000 to see your application. Make sure you have both the Convex development server and the Next.js development server running simultaneously.

## How It Works

1. **Authentication Flow**:
   - User signs in using Clerk UI components
   - Clerk manages authentication and user sessions
   - The Convex provider with Clerk integration adds auth tokens to Convex requests

2. **User Data Storage**:
   - When a user logs in and visits the dashboard, the app stores user data in Convex
   - The `store` mutation checks if the user exists and creates or updates the record

3. **Protected Routes**:
   - The middleware.ts file protects routes that require authentication
   - The dashboard page also has client-side protection if a user navigates directly

4. **User Identity in Convex**:
   - Convex functions can access the user's identity via `ctx.auth.getUserIdentity()`
   - This provides secure access to user data for backend operations

## Troubleshooting

Common issues and their solutions:

1. **Error: Cannot find module '@/convex/_generated/api'**
   - This error occurs because the default path alias `@/` only points to the `src/` directory
   - Fix this by either:
     - Using a relative path like `../../../convex/_generated/api` (adjust based on your file location)
     - Adding a path alias in `tsconfig.json` like `"@convex/*": ["./convex/*"]` and importing from `@convex/_generated/api`
   - Make sure you've run `npx convex dev` to generate the necessary files
   - The Convex dev server must be running to generate these files

2. **Authentication not working**
   - Check that you've set up all the Clerk environment variables correctly
   - Ensure the Clerk provider is wrapping your application

3. **Convex functions not working**
   - Verify that both the Convex provider and Clerk provider are correctly set up
   - Check the browser console for any Convex-related errors

4. **Changes to Convex schema or functions not reflecting**
   - Make sure your Convex dev server is running with `npx convex dev`
   - Try restarting the server if changes aren't being picked up

## Next Steps

After the initial integration is complete, you can:

1. **Add Authorization Logic**:
   - Implement role-based access control in your Convex functions
   - Create different dashboard views based on user roles

2. **Synchronize User Profile Updates**:
   - Listen for Clerk webhook events to update Convex when user profiles change
   - Build a user profile editor that updates both systems

3. **Add More Protected Resources**:
   - Create additional tables in Convex for user-specific data
   - Implement ownership checks in your Convex functions 