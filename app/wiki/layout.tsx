import { WikiProvider } from "@/contexts/WikiContext";
import "./wiki.css";

export const metadata = {
  title: "Textlands Codex",
  description: "The complete encyclopedia of Textlands - items, enemies, skills, NPCs, and more",
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <div className="wiki-root">
        {/* CRT scanline overlay */}
        <div className="wiki-scanlines" aria-hidden="true" />

        {/* Vignette effect */}
        <div className="wiki-vignette" aria-hidden="true" />

        {children}
      </div>
    </WikiProvider>
  );
}
