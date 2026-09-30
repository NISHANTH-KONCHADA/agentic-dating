# DESIGN.md — Agentic Dating Design System

## Design Language: "Neural Noir"
Dark, sophisticated, with electric accents. Feels like a premium AI product, not a generic startup.
No purple-gradient AI look. Think: Stripe meets Figma meets a dating app that takes itself seriously.

---

## Color Palette

```
Background:     #09090b  (zinc-950)
Surface:        #111113  (custom near-black)
Surface-2:      #18181b  (zinc-900)
Border:         #27272a  (zinc-800)
Border-subtle:  #1f1f22

Accent-Primary: #e4ff1a  (electric lime — for primary CTAs, live indicators)
Accent-Warm:    #ff6b35  (electric orange — for match scores, chemistry)
Accent-Cool:    #3b82f6  (blue-500 — for "cool" agent-side messages)
Accent-Rose:    #f43f5e  (rose-500 — for hearts, mutual matches)

Text-Primary:   #fafafa  (zinc-50)
Text-Secondary: #a1a1aa  (zinc-400)
Text-Muted:     #52525b  (zinc-600)

Success:        #22c55e  (green-500)
Warning:        #f59e0b  (amber-500)
Error:          #ef4444  (red-500)
```

## Typography

```
Font: "Inter Variable" (Google Fonts) — clean, legible at 1080p
Mono: "JetBrains Mono" — for agent transcripts, code

Scale:
  display-2xl: 4.5rem / 1.1  (hero)
  display-xl:  3.75rem / 1.15 (section headers)
  display-lg:  3rem / 1.2
  xl:          1.25rem / 1.75
  lg:          1.125rem / 1.75
  base:        1rem / 1.75
  sm:          0.875rem / 1.5
  xs:          0.75rem / 1.4

Weight: 400 body, 500 medium labels, 600 semibold UI, 700 bold headings
```

## Spacing

Base unit: 4px (0.25rem)
Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

## Border Radius

```
sm:   4px   (inputs, chips)
md:   8px   (cards inner)
lg:   12px  (cards)
xl:   16px  (panels)
2xl:  24px  (large cards)
full: 9999px (badges, avatars)
```

## Motion Rules

```
Duration: 
  micro: 100ms   (hover states)
  quick: 200ms   (transitions)
  normal: 300ms  (page elements)
  slow: 500ms    (reveals)
  veryslow: 800ms (hero animations)

Easing:
  standard: cubic-bezier(0.4, 0, 0.2, 1)
  enter:    cubic-bezier(0, 0, 0.2, 1)
  exit:     cubic-bezier(0.4, 0, 1, 1)
  spring:   spring(1, 80, 10, 0)

Rules:
- All hover effects: 200ms standard
- Page transitions: 300ms enter easing
- Staggered lists: 50ms delay between items
- Typing indicators: pulse 1.4s ease-in-out infinite
- Score bars: fill animation 800ms ease-out with CountUp
- prefers-reduced-motion: disable all animations
```

## Component Patterns

### Person Card
- 2xl radius, Surface-2 bg, Border border
- Hover: subtle y-translate (-2px), border becomes Accent-Primary/30
- Avatar: 48px circle with gradient ring for "online" status
- Chemistry score: Accent-Warm pill

### Date Transcript Bubble
- Agent A (person): right-aligned, bg Surface-2, Accent-Cool left border
- Agent B (person): left-aligned, bg Surface, Accent-Rose left border
- Typing indicator: 3 animated dots, Accent-Primary color
- Timestamp: xs muted mono

### Profile Radar Chart
- 7 dimensions: Energy, Ambition, Social, Adventure, Creativity, Warmth, Humor
- Stroke: Accent-Primary, Fill: Accent-Primary/10
- Grid lines: Border color

### Score Badge
- 90+: Accent-Primary bg, dark text
- 75-89: Accent-Warm bg, white text
- 50-74: Surface-2 bg, Text-Secondary
- <50: Muted styling

## Iconography
Use lucide-react. Consistent 20px default, 16px inline, 24px section icons.

## Dark Theme
Default dark. No light mode for v1. Excellent contrast ratios (4.5:1 minimum).
Text on dark backgrounds uses Text-Primary or Text-Secondary — never pure white on pure black.
