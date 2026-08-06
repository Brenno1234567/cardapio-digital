---
kind: frontend_style
name: Tailwind CSS v4 with Custom Design Tokens and Mobile-First Styling
category: frontend_style
scope:
    - '**'
source_files:
    - src/app/globals.css
    - postcss.config.mjs
    - src/components/CardProduto.tsx
    - src/app/layout.tsx
    - src/app/cardapio/page.tsx
    - package.json
---

The Meu Cardápio application uses **Tailwind CSS v4** (via `@tailwindcss/postcss` plugin) as its primary styling system, combined with Next.js App Router's built-in CSS import mechanism. The styling approach is mobile-first with responsive utilities and a warm bakery-themed color palette.

## Styling System and Tools

- **Framework**: Tailwind CSS v4 with the new PostCSS-based pipeline (`@tailwindcss/postcss`)
- **CSS Processing**: PostCSS configuration in `postcss.config.mjs` using only the Tailwind plugin
- **Font System**: Google Fonts via Next.js `next/font/google` — Geist Sans and Geist Mono loaded as CSS variables
- **Icons**: Lucide React icons throughout the UI
- **State-driven styles**: Zustand for cart state, with conditional class names based on component state

## Design Tokens and Theme

Custom design tokens are defined in `src/app/globals.css` using Tailwind v4's `@theme` directive:
- **Colors**: Warm bakery palette including `--color-fundo: #FCF8F2` (cream background), green tones (`verde-claro`, `verde-normal`, `verde-escuro`, `verde-destaque`), and neutral grays (`cinza-texto`, `cinza-borda`)
- **Typography**: Geist font family with CSS custom properties for sans-serif and mono variants
- **Utility classes**: Custom `.no-scrollbar` and `.safe-bottom` classes for mobile-specific behaviors

## Component Styling Conventions

Components follow consistent patterns:
- **CardProduto.tsx**: Uses Tailwind utility classes for card layout with responsive breakpoints (`sm:` prefix), shadow effects, and hover states
- **Mobile navigation**: Bottom tab bar with fixed positioning and safe area support
- **Responsive grid**: Product grid adapts from 1 column on mobile to 4 columns on large screens
- **Color usage**: Consistent use of semantic color tokens (e.g., `text-verde-escuro`, `bg-verde-normal`, `border-cinza-borda/50`)

## Responsive Strategy

- **Mobile-first approach**: Base styles target mobile, with `sm:`, `md:`, `lg:`, `xl:` prefixes for larger screens
- **Touch-friendly**: Minimum touch targets, bottom navigation for mobile, hidden scrollbars
- **Safe areas**: iOS safe area insets handled via CSS `env(safe-area-inset-bottom)`
- **Flexible layouts**: Flexbox and CSS Grid with responsive breakpoints

## Global Styles and Layout

- **Root layout**: Full-height flex column layout with antialiased text
- **Body styling**: Cream background color, custom text color, horizontal overflow prevention
- **Image optimization**: Next.js configured for AVIF and WebP formats with Cloudinary and Unsplash remote patterns
- **Accessibility**: Semantic HTML structure, aria-labels on interactive elements, proper contrast ratios

## Architecture Decisions

- **No separate CSS files**: All styling uses Tailwind utility classes directly in JSX components
- **CSS-in-JS avoided**: No styled-components or emotion; pure Tailwind utilities
- **Component-scoped styles**: Only global styles in `globals.css`, everything else in component files
- **Design consistency**: Reusable color tokens and spacing patterns across all components