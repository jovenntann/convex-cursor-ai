"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

export default function CategoriesPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <h1 className="text-2xl font-bold px-4 lg:px-6">Categories</h1>
        <div className="px-4 lg:px-6">
          {/* Content will go here */}
        </div>
      </div>
    </div>
  )
} 