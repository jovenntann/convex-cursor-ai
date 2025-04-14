# Navigation Components

This document provides information about the navigation components and how active states are handled in the sidebar navigation.

## Active State Implementation

All navigation components (`NavMain`, `NavDocuments`, and `NavSecondary`) use Next.js's `usePathname` hook to determine when a navigation item is active based on the current URL path.

### Key Features

- **Current Path Detection**: Uses Next.js's `usePathname` hook to get the current route
- **Active State Logic**: An item is considered active when the current URL exactly matches or is a sub-route of the item's URL
- **ShadCN Integration**: Uses ShadCN's built-in `isActive` prop on the `SidebarMenuButton` component
- **Client-Side Navigation**: Uses Next.js `Link` component for smooth client-side navigation

## Implementation Details

### 1. Path Matching Logic

Each navigation component uses this pattern to determine if an item is active:

```tsx
const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
```

This approach:
- Marks an item as active when the URL exactly matches (e.g., `/dashboard`)
- Marks an item as active when on a sub-route (e.g., `/dashboard/analytics`)
- Supports hierarchical navigation structures

### 2. Component Structure

All navigation components follow a similar pattern:

```tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function NavComponent({ items }) {
  const pathname = usePathname()
  
  return (
    // Component structure
    {items.map((item) => {
      const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
      
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })}
  )
}
```

### 3. ShadCN Integration

The active state styling is provided by ShadCN through:

- The `isActive` prop on `SidebarMenuButton`
- This sets the `data-active="true"` attribute which applies styling based on your theme
- Default styling typically changes background color and text color

## Modified Components

The following components have been updated with active state detection:

1. **NavMain** (`src/components/nav-main.tsx`)
   - Primary navigation items in the sidebar
   - Each item shows as active when its route is active

2. **NavDocuments** (`src/components/nav-documents.tsx`)
   - Document-related navigation items
   - Includes dropdown menus for additional actions

3. **NavSecondary** (`src/components/nav-secondary.tsx`)
   - Secondary navigation items, typically shown at the bottom of the sidebar
   - Uses the same active state detection pattern

## Usage

When creating new navigation items, make sure to:

1. Use meaningful URL paths that reflect your application structure
2. Set the `url` property correctly on each navigation item
3. Use `isActive` prop on the `SidebarMenuButton` component

## Example

Adding a new item to the main navigation:

```tsx
// In app-sidebar.tsx
const data = {
  navMain: [
    // Existing items...
    {
      title: "New Feature",
      url: "/dashboard/new-feature",
      icon: IconNewFeature,
    },
  ],
  // Other navigation sections...
}
```

The active state will automatically work for the new item based on the URL. 