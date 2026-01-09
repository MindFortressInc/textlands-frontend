/**
 * Haptic feedback utility for mobile devices.
 * Uses navigator.vibrate on Android and falls back gracefully on iOS.
 * iOS doesn't support navigator.vibrate but provides haptics through CSS/touch events.
 */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

// Vibration patterns in milliseconds
const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
};

/**
 * Trigger haptic feedback if supported.
 * @param style - The type of haptic feedback
 */
export function haptic(style: HapticStyle = "light"): void {
  // Check if we're on a mobile device
  if (typeof window === "undefined") return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (!isMobile) return;

  // Try navigator.vibrate (Android)
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(PATTERNS[style]);
    } catch {
      // Vibration failed, ignore silently
    }
  }
}

/**
 * Haptic feedback for button press
 */
export function hapticTap(): void {
  haptic("light");
}

/**
 * Haptic feedback for successful action
 */
export function hapticSuccess(): void {
  haptic("success");
}

/**
 * Haptic feedback for error/failure
 */
export function hapticError(): void {
  haptic("error");
}

/**
 * Haptic feedback for important action (send, submit)
 */
export function hapticImpact(): void {
  haptic("medium");
}
