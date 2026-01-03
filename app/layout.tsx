import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { UIStringsProvider } from "@/contexts/UIStringsContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { GameProvider } from "@/contexts/GameContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CombatProvider } from "@/contexts/CombatContext";
import { FloatingEffectsProvider } from "@/contexts/FloatingEffectsContext";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingEffectsLayer } from "@/components/effects/FloatingEffectsLayer";

export const metadata: Metadata = {
  title: "Textlands",
  description: "A Living Text MMO",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Textlands",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <UIStringsProvider>
              <SettingsProvider>
                <SessionProvider>
                  <GameProvider>
                    <CombatProvider>
                      <FloatingEffectsProvider>
                        <ThemeProvider>
                          <DynamicFavicon />
                          {children}
                          <FloatingEffectsLayer />
                        </ThemeProvider>
                      </FloatingEffectsProvider>
                    </CombatProvider>
                  </GameProvider>
                </SessionProvider>
              </SettingsProvider>
            </UIStringsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
