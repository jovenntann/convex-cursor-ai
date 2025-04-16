"use client";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';

export default function Provider({ children }: { children: ReactNode }) {
  const convex = new ConvexReactClient(convexUrl);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ConvexProviderWithClerk>
  );
} 