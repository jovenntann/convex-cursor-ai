"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/home");
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
