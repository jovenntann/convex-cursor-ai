"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  // Use optional chaining and conditional execution
  const getUser = isSignedIn ? useQuery(api.users.getUser) : null;

  // Wait until the component is mounted before rendering anything that depends on auth
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isLoaded) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-8">
      <h1 className="text-4xl font-bold text-center">
        Welcome to Convex + Clerk Demo
      </h1>
      <p className="text-xl text-center max-w-2xl">
        This is a simple demo showing the integration of Convex and Clerk for authentication and real-time data.
      </p>
      <div className="flex gap-4">
        {!isSignedIn && (
          <Link href="/sign-in">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium">
              Login
            </button>
          </Link>
        )}
        {isSignedIn && (
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
