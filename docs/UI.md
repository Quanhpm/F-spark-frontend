# F-Spark UI & Design Guidelines

This document defines the unified UI rules, color palette, typography settings, and CSS guidelines for the F-Spark project. All current and future pages must strictly follow these rules to maintain a simple, elegant, and consistent aesthetic.

---

## 1. Color System

We use a curated, warm neutral palette balanced with high-contrast, premium brand colors. Avoid generic primary colors (e.g., solid blue, red, green).

| Token Name | Hex Code | Visual | Usage Guideline |
| :--- | :--- | :--- | :--- |
| `brand-primary` | `#F05423` | ![#F05423](https://via.placeholder.com/15/F05423/000000?text=+) | Main action buttons, active badges, brand marks, and key interactive element states. |
| `brand-secondary`| `#EDA12F` | ![#EDA12F](https://via.placeholder.com/15/EDA12F/000000?text=+) | Highlight states, secondary badges (e.g., "In Progress"), borders on focused inputs, progress bars. |
| `surface-warm` | `#f5ebdc` | ![#f5ebdc](https://via.placeholder.com/15/f5ebdc/000000?text=+) | Sidebars/showcase background panels, warm card borders, secondary container surfaces. |
| `background` | `#F5F5F5` | ![#F5F5F5](https://via.placeholder.com/15/F5F5F5/000000?text=+) | Main page background. Prevents visual fatigue compared to pure white. |
| `surface` | `#ffffff` | ![#ffffff](https://via.placeholder.com/15/ffffff/000000?text=+) | Cards, modal sheets, dropdowns, input fields. |
| `foreground` | `#1a1a1a` | ![#1a1a1a](https://via.placeholder.com/15/1a1a1a/000000?text=+) | Primary headings, body copy, and active text elements. |
| `border` | `#e2e8f0` | ![#e2e8f0](https://via.placeholder.com/15/e2e8f0/000000?text=+) | Standard divider lines and default input/card borders. |
| `border-warm` | `#e6dacb` | ![#e6dacb](https://via.placeholder.com/15/e6dacb/000000?text=+) | Borders for cards or blocks sitting on warm-beige backgrounds. |
| `muted` | `#737373` | ![#737373](https://via.placeholder.com/15/737373/000000?text=+) | Descriptions, labels, icons, metadata, and placeholder text. |

### Tailwind Theme Tokens (`src/app/globals.css`)
```css
@import "tailwindcss";

@theme {
  --color-background: #f5f5f5;
  --color-foreground: #1a1a1a;
  --color-surface: #ffffff;
  --color-surface-warm: #f5ebdc;
  --color-border: #e2e8f0;
  --color-border-warm: #e6dacb;
  --color-muted: #737373;
  --color-brand-primary: #f05423;
  --color-brand-primary-hover: #d84315;
  --color-brand-secondary: #eda12f;
  --font-sans: var(--font-roboto), Arial, Helvetica, sans-serif;
}

:root {
  --background: var(--color-background);
  --foreground: var(--color-foreground);
  --surface: var(--color-surface);
  --surface-warm: var(--color-surface-warm);
  --border: var(--color-border);
  --border-warm: var(--color-border-warm);
  --muted: var(--color-muted);
  --brand-primary: var(--color-brand-primary);
  --brand-primary-hover: var(--color-brand-primary-hover);
  --brand-secondary: var(--color-brand-secondary);
  --brand: var(--brand-primary);
}
```

### Centralized TypeScript Constants (`src/shared/constants/colors.ts`)
Prefer Tailwind utility classes for production UI. When inline styles are necessary, use the type-safe `COLORS` constant rather than hardcoded hex values or raw CSS variable string literals.

```typescript
import { COLORS } from "@/shared/constants/colors";

// Example Usage in React component inline styles:
const myStyle = {
  background: COLORS.background,
  color: COLORS.foreground,
  borderColor: COLORS.borderWarm
};
```

#### Theme Switching Strategy
1. **CSS Files**: Target class-based selectors (e.g., `body[data-theme="dark"]` or `.dark-theme`) to override the root CSS custom properties.
2. **TS/JS Inline Styles**: By referencing `COLORS` (e.g., `COLORS.background` which evaluates to `"var(--background)"`), any runtime changes to the body's CSS properties will instantly and automatically apply to the inline-styled elements without requiring React state re-renders.


---

## 2. Typography

The sole font family for the project is **Roboto**. This font must be loaded in the root layout and configured with the exact weights below:

- **Font Family**: `Roboto, sans-serif`
- **Loaded Weights**:
  - `300` (Light): Subtitles, helper text, and secondary stats.
  - `400` (Regular / Normal): Standard paragraph body text, form labels.
  - `500` (Medium): UI elements, buttons, column titles, table headers.
  - `700` (Bold): Headings (h1, h2, h3, h4) and important callouts.
- **Italic Style**: Available and loaded for weight `400` only. Use italic style sparingly (e.g., empty state instructions, notes, quotes).

### Typography Scale Guidelines
- **Page Headings (h1)**: Size `clamp(28px, 3.2vw, 36px)`, Weight `700`, line-height `1.2`.
- **Section Headings (h2)**: Size `24px` - `26px`, Weight `700`, line-height `1.3`.
- **Card/Subsection Titles**: Size `16px` - `18px`, Weight `500` or `700`.
- **Body Text**: Size `14px` - `15px`, Weight `400`, line-height `1.6`.
- **Captions/Labels**: Size `11px` - `12px`, Weight `500` or `700` (uppercase when styling headers).

---

## 3. Layout & Layout Structures

To achieve a **simple and elegant** look, avoid cluttered color sections. Follow these layout structures:

1. **Containers**: Use a maximum border-radius of `16px` for cards and major modules, and `12px` for smaller UI widgets (like buttons, input fields, badges).
2. **Borders and Lines**: Card borders should be thin (`1px`) and use soft colors:
   - On `#F5F5F5` background, use card border: `1px solid var(--border)` (`#e2e8f0`).
   - On `#f5ebdc` background, use card border: `1px solid var(--border-warm)` (`#e6dacb`).
3. **Card Shadows**: Do not use heavy black shadows. Use soft, transparent shadows for depth:
   - Standard: `box-shadow: 0 10px 30px rgba(26, 26, 26, 0.03);`
   - Interactive: `box-shadow: 0 20px 45px rgba(26, 26, 26, 0.04);`
4. **Spacing Consistency**:
   - Inside cards: `padding: 24px` to `40px` depending on screen size.
   - Grid gap: `12px` to `24px` for structural components.

---

## 4. Components Style Rules

### Buttons
- **Primary Action Button**:
  - Background: `var(--brand-primary)` (`#F05423`).
  - Text Color: `#ffffff` (White).
  - Hover: Background `#d84315` (slightly darker warm orange).
  - Shape: Border radius `12px`.
  - Font weight: `500` (Medium).
- **Secondary Action Button (Outline/Text)**:
  - Background: `transparent` or `var(--surface)`.
  - Border: `1px solid var(--border)`.
  - Hover: Background `var(--background)`.
  - Text Color: `var(--foreground)`.

### Form Fields (Inputs)
- **Container**: Height `50px` - `52px` with a border radius of `12px`, border `1px solid var(--border)`.
- **Focus State**: On focus, the border must change to `var(--brand-secondary)` (`#EDA12F`) with a soft glow `box-shadow: 0 0 0 4px rgba(237, 161, 47, 0.12)`.
- **Placeholder**: Use a light gray `#a3a3a3` for input placeholders.

---

## 5. UI Philosophy: "Simple & Elegant"

- **Less is More**: Eliminate multi-colored indicators (e.g. mix of purple, indigo, blue, green). Standardize on `brand-primary` and `brand-secondary` for color accents.
- **Semantic Status Colors**: `success`, `warning`, and `danger` tones are allowed only for clear operational states (e.g. Active, Pending, Locked, Delete). Do not use these tones as page themes or decorative accents.
- **White Space**: Provide ample padding and line height to let text breathe. Avoid cramming information.
- **Micro-interactions**: Use transitions (`150ms` to `200ms` with ease curve) for hover states on buttons, cards, and text links to make the app feel tactile and premium.

---

## 6. Implementation Standard

### Preferred Styling Method

- Use **Tailwind CSS utility classes** for reusable UI and module UI.
- Use `src/app/globals.css` only for `@import "tailwindcss"`, theme tokens, legacy CSS variables required by `COLORS`, and base element rules.
- Use inline styles only for very small one-off dynamic values that are awkward in Tailwind.
- Do not create global CSS or CSS Modules for module-specific layouts.
- Do not hardcode hex colors in module UI unless the value is a one-off semantic status tone. Prefer Tailwind tokens such as `bg-surface`, `text-foreground`, `border-border`, `text-brand-primary`, or `COLORS` in inline styles.

Recommended structure:

```txt
src/shared/components/
  ui/
  layout/

src/modules/<module>/
  components/
  hooks/
  api/
  types/
```

### Shared UI Import

Use shared UI primitives from:

```ts
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
```

Do not recreate a new button/input/card style inside a feature module unless the shared primitive cannot support the case.

### Utility Classnames

Use:

```ts
import { cn } from "@/shared/lib";
```

Example:

```tsx
<div
  className={cn(
    "grid min-w-0 gap-6 rounded-xl border border-border bg-surface p-6",
    isActive && "border-brand-secondary shadow-card-interactive",
  )}
/>
```

---

## 7. App Shell & Route Layouts

Workspace routes use the shared app shell:

```txt
src/app/admin/layout.tsx
src/app/student/layout.tsx
src/app/mentor/layout.tsx
```

The shell provides:

- Sidebar navigation.
- Topbar with current workspace and active page.
- Session guard.
- Role guard.
- Sign out action.

Do not build a custom sidebar/topbar inside individual pages. Pages should render only their module content.

Route prefixes:

```txt
/admin/dashboard
/admin/users
/admin/imports
/admin/problems

/student/dashboard
/student/groups
/student/tasks
/student/problems

/mentor/groups
/mentor/availability
```

---

## 8. Shared UI Components

### Button

```tsx
import { Plus } from "lucide-react";
import { Button } from "@/shared/components";

<Button icon={<Plus size={16} />}>Create</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
```

Variants:

- `primary`: main action.
- `secondary`: outline action.
- `ghost`: quiet action in headers/toolbars.
- `danger`: destructive action.

Sizes:

- `sm`
- `md`
- `lg`

### TextInput

```tsx
import { Search } from "lucide-react";
import { TextInput } from "@/shared/components";

<TextInput
  icon={<Search size={16} />}
  label="Search"
  placeholder="Search by name or email"
/>
```

### Select

```tsx
import { Select } from "@/shared/components";

<Select label="Role">
  <option value="">All roles</option>
  <option value="ADMIN">Admin</option>
  <option value="STUDENT">Student</option>
  <option value="MENTOR">Mentor</option>
</Select>
```

### Badge

```tsx
import { Badge } from "@/shared/components";

<Badge tone="success">Active</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Locked</Badge>
```

Badge tones are semantic only. Use them for data states, not for decorative color variety.

### Card

```tsx
import { Card, CardContent, CardHeader } from "@/shared/components";

<Card>
  <CardHeader
    title="Users"
    description="Manage accounts and access."
    actions={<Button>Create user</Button>}
  />
  <CardContent>{/* table or form */}</CardContent>
</Card>
```

### PageHeader

```tsx
import { PageHeader } from "@/shared/components";

<PageHeader
  eyebrow="Admin"
  title="Users"
  description="Manage accounts, statuses, and password resets."
  actions={<Button>Create user</Button>}
/>
```

### EmptyState & LoadingState

```tsx
import { EmptyState, LoadingState } from "@/shared/components";

<LoadingState title="Loading users" />
<EmptyState title="No users found" description="Try changing your filters." />
```

---

## 9. Page Composition Rules

Use this order for management pages:

1. `PageHeader`
2. Filter/search toolbar
3. Main data surface (`Card`, table, board, or list)
4. Empty/loading/error states
5. Modal/drawer only when the action requires focused input

Page example:

```tsx
<div className="grid min-w-0 gap-6">
  <PageHeader
    eyebrow="Admin"
    title="Users"
    description="Manage accounts, roles, and statuses."
    actions={<Button>Create user</Button>}
  />

  <Card>
    <CardContent>
      {/* filters + table */}
    </CardContent>
  </Card>
</div>
```

Recommended page class:

```tsx
<div className="grid min-w-0 gap-6">{/* page content */}</div>
```

---

## 10. Icons

- Use `lucide-react` icons.
- Buttons that trigger clear actions should include an icon when possible.
- Common mappings:
  - Create: `Plus`
  - Edit: `Pencil`
  - Delete: `Trash2`
  - Search: `Search`
  - Filter: `SlidersHorizontal`
  - Save: `Save`
  - Upload: `Upload`
  - Download: `Download`
  - Calendar/time: `CalendarClock`
  - Users/groups: `Users`
  - Tasks: `ClipboardList`
  - Problems/docs: `BookOpen`

Do not hand-draw SVG icons if a Lucide icon exists.

---

## 11. Responsive Rules

- App shell owns sidebar/topbar responsiveness.
- Use the shared breakpoint contract: desktop above `960px`, tablet from
  `761px` to `960px`, phone from `481px` to `760px`, and compact phone at
  `480px` or below. Always verify the hard minimum at `320px`.
- Pages should use CSS Grid with `minmax(0, 1fr)` and wrap controls naturally.
- Toolbar controls should stack on mobile.
- Shared cards use `16px` mobile padding and `24px` desktop padding. Headers
  with actions stack below `761px`; do not force every action to full width.
- Interactive controls must provide at least a `44px` touch target on mobile.
  Icon-only actions still need an accessible name and the same touch target.
- Editable controls use at least `16px` text on mobile to avoid browser auto
  zoom, then may return to the standard `14px` scale above `760px`.
- Avoid viewport-width font scaling. Use fixed sizes or `clamp` only for true
  page headings.
- Text must not overflow buttons, cards, badges, or table cells. Use
  `min-width: 0`, wrapping, word breaking, or ellipsis where appropriate.
- Do not allow horizontal scrolling at the page/body level. Data-management
  tables keep their table layout on desktop and use a mobile card-list below
  `761px`; Kanban is the intentional horizontally scrolling exception.
- Use `ResponsiveDialog` for module dialogs instead of recreating fixed
  overlays. It owns focus trapping/restoration, Escape handling, body scroll
  lock, `dvh` sizing, scrollable content, mobile action stacking, and safe-area
  padding. Full-screen mode is used for long forms below `761px`.
- Mobile shell links, drawer links, notification controls, and footer links are
  interactive controls too; their clickable box must meet the same `44px`
  minimum as buttons.
- Final responsive regression covers `320x568`, `360x800`, `375x667`,
  `390x844`, `430x932`, `768x1024`, `1024x768`, `1440x900`, and landscape
  `844x390`, including continuous checks around `640px`, `760px`, and `960px`.

Example toolbar:

```tsx
<div className="grid grid-cols-[minmax(220px,1fr)_repeat(2,minmax(160px,220px))] gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]">
  {/* filters */}
</div>
```

---

## 12. AI Coding Rules For UI

When an AI agent builds UI in this repo, it must:

1. Read `UI.md`.
2. Read `TEAM_WORKFLOW.md`.
3. Use `src/shared/components/ui` primitives first.
4. Use `src/shared/components/layout/AppShell` only through route layouts, not inside individual pages.
5. Keep module-specific UI inside `src/modules/<module>/components`.
6. Use Tailwind utility classes for module page styling.
7. Use `lucide-react` icons.
8. Avoid custom palettes, gradients, decorative blobs, and unrelated hero sections.
9. Run `npm run typecheck`.
10. Run `npm run lint`.
