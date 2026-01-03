import { WikiProvider } from "@/contexts/WikiContext";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";
import "./wiki.css";

export const metadata = {
  title: "Textlands Wiki",
  description: "The complete encyclopedia of Textlands - items, enemies, skills, NPCs, and more",
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WikiProvider>
        <div className="wiki-root">
          {children}
        </div>
      </WikiProvider>
    </ThemeProvider>
  );
}
