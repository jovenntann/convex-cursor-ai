"use client";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
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