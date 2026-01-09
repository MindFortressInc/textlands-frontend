# iOS Mobile Best Practices

Reference guide for iOS Safari/WebKit mobile development issues and solutions.

## Keyboard Handling

### The Problem
iOS Safari doesn't resize the viewport when the keyboard opens - it overlays on top of the page. This causes bottom-pinned inputs (like chat/command inputs) to be hidden behind the keyboard.

### Solution (2025 Best Practice)

**Use `dvh` units + visualViewport API fallback:**

```tsx
// Layout container
<main className="h-dvh flex flex-col">
```

```tsx
// Viewport meta (Next.js layout.tsx)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,           // Prevents auto-zoom on input focus
  userScalable: false,
  viewportFit: "cover",      // Handles notch/safe areas
  interactiveWidget: "resizes-content",  // Tells browser to resize for keyboard
};
```

### visualViewport Hook

Track keyboard state with CSS custom properties:

```tsx
// lib/useKeyboardVisible.ts
const visualViewport = window.visualViewport;
const currentHeight = visualViewport.height;
const keyboardHeight = initialHeight - currentHeight - visualViewport.offsetTop;

// Set CSS variables for layout adjustments
document.documentElement.style.setProperty("--viewport-height", `${currentHeight}px`);
document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight}px`);

// Toggle class for CSS-based handling
document.body.classList.toggle("keyboard-visible", isVisible);
```

### CSS for Keyboard-Visible State

```css
/* Constrain container to visual viewport when keyboard open */
body.keyboard-visible .game-container {
  height: var(--viewport-height, 100dvh);
  max-height: var(--viewport-height, 100dvh);
  transition: height 0.15s ease-out;
}

/* Hide non-essential UI to save space */
@media (max-width: 767px) {
  body.keyboard-visible .quick-actions-container {
    display: none;
  }
}
```

### Input Focus Scrolling

iOS sometimes fails to scroll inputs into view. Add manual scroll:

```tsx
const handleFocus = useCallback(() => {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isIOS && inputRef.current) {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",  // "center" works better than "end" on iOS
      });
    }, 350);  // Wait for keyboard animation
  }
}, []);
```

### Known iOS 26 Bug
`visualViewport.offsetTop` doesn't reset to 0 when keyboard dismisses. This is an Apple bug - no workaround yet except waiting for Apple fix.

---

## Safe Areas (Notch/Home Indicator)

### CSS Environment Variables

```css
/* Padding for safe areas */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);

/* With fallback */
padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
```

### Viewport Meta
Ensure `viewport-fit=cover` is set to enable safe area insets:

```tsx
viewportFit: "cover",
```

---

## Touch Interactions

### Prevent Text Selection on Interactive Elements

```css
button,
[role="button"],
.interactive-element {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
```

### Disable Tap Highlight

```css
.touchable {
  -webkit-tap-highlight-color: transparent;
}
```

### Touch Target Sizes

Apple HIG recommends minimum 44x44pt touch targets:

```css
@media (max-width: 767px) {
  button, .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Prevent Double-Tap Zoom

```css
.touchable {
  touch-action: manipulation;
}
```

---

## Input Handling

### Prevent Zoom on Input Focus

iOS auto-zooms inputs with font-size < 16px:

```css
@media (max-width: 767px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

### Keyboard Hints

```tsx
<input
  enterKeyHint="send"      // Shows "send" on iOS keyboard
  autoCapitalize="sentences"
  autoCorrect="on"
  spellCheck={true}
/>
```

---

## Performance

### Smooth Scrolling

```css
.scrollable {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;  /* Prevents pull-to-refresh interference */
}
```

### GPU Acceleration for Animations

```css
.animated {
  transform: translateZ(0);  /* Forces GPU layer */
  will-change: transform;
}
```

---

## PWA / Add to Home Screen

### Apple Web App Meta

```tsx
// Next.js metadata
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "App Name",
},
```

### Status Bar Handling

`black-translucent` allows content to flow under status bar. Combine with safe-area-inset-top padding.

---

## References

- [Fix mobile keyboard overlap with VisualViewport](https://dev.to/franciscomoretti/fix-mobile-keyboard-overlap-with-visualviewport-3a4a)
- [Fix mobile keyboard overlap with dvh](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport)
- [Apple Human Interface Guidelines - iOS](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/)
