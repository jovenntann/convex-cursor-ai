"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const convexUser = useQuery(api.users.getUser);
  const storeUser = useMutation(api.users.store);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Only call storeUser if the user is signed in and we have a convexUser
    if (isSignedIn && isLoaded && user && convexUser !== undefined) {
      storeUser();
    }
  }, [isSignedIn, isLoaded, user, convexUser, storeUser]);

  if (!isMounted || !isLoaded) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">You need to sign in to access the dashboard</h1>
        <a href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded">
          Sign In
        </a>
      </div>
    );
  }

  // Prepare user data for the sidebar
  const userData = {
    name: user?.firstName || "User",
    email: user?.emailAddresses[0]?.emailAddress || "No email",
    avatar: user?.imageUrl || "/avatars/default.jpg",
  };

  const handleLogout = () => signOut({ redirectUrl: '/' });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        variant="inset" 
        userData={userData} 
        onLogout={handleLogout} 
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 