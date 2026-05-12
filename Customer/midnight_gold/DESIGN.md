---
name: Midnight & Gold
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#dfffdb'
  on-tertiary: '#003911'
  tertiary-container: '#00fb64'
  on-tertiary-container: '#006e27'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#6bff83'
  tertiary-fixed-dim: '#00e55b'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#00531b'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

This design system is built on the philosophy of "Aggressive Minimalism." It targets a premium, high-energy audience that values speed, precision, and luxury. By pairing a deep obsidian foundation with electric yellow accents, the UI commands attention while maintaining a sophisticated edge.

The aesthetic direction is **High-Contrast / Bold**. It avoids the clutter of traditional dashboards, favoring massive focal points and extreme legibility. The emotional response is one of authority and cinematic intensity—designed to make every interaction feel like a high-stakes, premium experience.

## Colors

The palette is strictly limited to maximize visual impact. The core of the design system is a true obsidian black (#000000), which serves as the canvas for all interactions.

- **Primary:** Electric Yellow (#FFD700) is reserved exclusively for primary actions, progress indicators, and critical brand moments.
- **Surface:** Deep Black (#000000) for all backgrounds to achieve infinite depth.
- **Success:** A vibrant, high-saturation Green (#00FF66) provides a modern, "go" signal.
- **Warning/Utility:** Crisp White (#FFFFFF) is used for secondary information and warnings, providing a stark, clean alternative to the yellow.
- **Subtle Neutral:** Dark Grey (#1A1A1A) may be used for secondary containers to differentiate from the base surface.

## Typography

This design system utilizes **Inter** for its utilitarian precision and modern feel. The type scale is optimized for high-speed scanning and extreme legibility against dark backgrounds.

Headlines use heavy weights (800 and 700) with tight letter spacing to create a dense, "loud" visual rhythm. Body text is kept clean with generous line heights to ensure readability. All labels and uppercase text utilize a slight letter-spacing increase to maintain clarity at smaller scales.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. Content is organized within a 12-column grid system for desktop, but spacing is driven by a strict 8px rhythmic unit to maintain mathematical harmony.

Generous margins (32px+) are encouraged to prevent the high-contrast elements from feeling cluttered. Negative space is treated as a premium asset—the "obsidian" background should be allowed to breathe between core modules.

## Elevation & Depth

In a pure black environment, traditional drop shadows are ineffective. This design system communicates depth through **Tonal Layering** and **High-Contrast Outlines**.

- **Level 0:** The base obsidian surface (#000000).
- **Level 1:** Floating cards or modals use a subtle #121212 background with a thin (1px) border in #222222 or #FFD700 (for active states).
- **Glassmorphism:** For premium overlays, use a backdrop blur (20px) on a semi-transparent black surface (alpha 0.7) to create a "tinted glass" effect.
- **Glow:** Only primary buttons and critical indicators may use a soft "electric yellow" outer glow to simulate a light source in the dark environment.

## Shapes

The design system balances its aggressive color palette with **Rounded** corners to maintain a premium, approachable feel. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Large Containers:** Cards and modals use a 1.5rem (24px) radius for a modern, hardware-inspired look.
- **Pills:** Status indicators and chips use a fully rounded (pill) shape to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Background #FFD700, Text #000000. Bold weight. No border.
- **Secondary:** Background transparent, Border 2px #FFFFFF, Text #FFFFFF.
- **Tertiary:** Text #FFD700, no background. Use for low-priority actions.

### Input Fields
- **Default:** Background #121212, Border 1px #222222, Text #FFFFFF.
- **Focus:** Border 2px #FFD700.
- **Error:** Border 2px #FFFFFF (as per warning color requirements).

### Chips & Tags
- Small, pill-shaped elements. Success chips use #00FF66 text on a 10% opacity green background.

### Cards
- Obsidian cards use a 1px border (#222222). When hovered, the border transitions to #FFD700 to provide high-energy feedback.

### Feedback States
- **Success:** Use vibrant #00FF66 for icons and confirmation text.
- **Warning:** Use crisp #FFFFFF. This departure from traditional "orange/red" signals a unique brand identity where "white" represents a neutral alert or cautionary state.