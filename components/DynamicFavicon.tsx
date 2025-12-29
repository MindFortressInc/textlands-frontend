"use client";

import { useEffect } from "react";
import { useTheme } from "@/lib/themes/ThemeProvider";
import { themes } from "@/lib/themes";

/**
 * Dynamic favicon that matches the user's selected theme.
 * Generates an SVG "T" with the theme's accent color on the background.
 */
export function DynamicFavicon() {
  const { themeId } = useTheme();

  useEffect(() => {
    const theme = themes[themeId] || themes.terminal;
    const { void: bg, amber: accent } = theme.colors;

    // Create SVG favicon with theme colors
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="4" fill="${bg}"/>
        <text
          x="16"
          y="23"
          text-anchor="middle"
          font-family="monospace"
          font-weight="bold"
          font-size="16"
          fill="${accent}"
        >TL</text>
      </svg>
    `;

    // Convert to data URL
    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    // Update favicon
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = dataUrl;

    // Also update apple-touch-icon for iOS
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleLink) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    appleLink.href = dataUrl;
  }, [themeId]);

  return null;
}
