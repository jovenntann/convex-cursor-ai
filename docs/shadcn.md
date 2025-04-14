# Setting up Shadcn UI

This document outlines the steps taken to set up Shadcn UI in our Next.js project.

## Installation Steps

1. First, we'll run the `shadcn` init command to set up the basic configuration:
```bash
npx shadcn@latest init
```

2. During the initialization, we selected the following options:
   - Style: Default (Tailwind CSS)
   - Base color: Neutral
   - CSS variables: Yes (automatically configured)
   - Components directory: src/components/ui
   - Utilities directory: src/lib/utils

3. The initialization:
   - Added required dependencies
   - Created necessary configuration files
   - Set up the component directory structure
   - Configured Tailwind CSS
   - Created utils.ts for shared utilities

## Usage

After installation, components can be added using the CLI:

```bash
npx shadcn@latest add [component-name]
```

For example, to add multiple components:
```bash
npx shadcn@latest add button card input
```

## Project Structure

The installation creates the following structure:
```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts
├── styles/
│   └── globals.css
```

## Installed Components

The following components have been installed and are ready to use:

1. Button (`@/components/ui/button.tsx`)
   - A versatile button component with various styles and states
   - Supports different variants: default, destructive, outline, secondary, ghost, link
   - Configurable sizes: default, sm, lg, icon

2. Card (`@/components/ui/card.tsx`)
   - A container component for displaying content
   - Includes sub-components:
     - Card
     - CardHeader
     - CardTitle
     - CardDescription
     - CardContent
     - CardFooter

3. Input (`@/components/ui/input.tsx`)
   - A form input component
   - Supports various input types
   - Can be styled and customized using Tailwind classes

4. Sidebar (`@/components/ui/sidebar.tsx`)
   - A comprehensive sidebar navigation component
   - Includes sub-components:
     - Sidebar
     - SidebarHeader
     - SidebarContent
     - SidebarFooter
     - SidebarMenu
     - SidebarMenuItem
     - SidebarMenuButton
   - Supports active states via the `isActive` prop
   - Handles collapsible modes (full, icon, offcanvas)

## Navigation with Active States

We've implemented active state detection in our navigation components using ShadCN's sidebar components:

1. The `SidebarMenuButton` component accepts an `isActive` prop that controls the active state styling
2. When `isActive={true}`, the component applies the `data-active="true"` attribute
3. This attribute is styled with the appropriate background and text colors based on the theme

Example usage:
```tsx
<SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
  <Link href="/dashboard">Dashboard</Link>
</SidebarMenuButton>
```

For more details on the navigation implementation, see [navigation.md](./navigation.md).

## Theme Customization

The theme can be customized by modifying:
1. `tailwind.config.js` for Tailwind-specific configurations
2. `globals.css` for CSS variables and global styles

The project uses the Neutral color palette as its base theme, which can be customized in the CSS variables. 