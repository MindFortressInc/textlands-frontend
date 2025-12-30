"use client";

import { useState, useEffect } from "react";
import type { WorldTemplate } from "@/types/game";
import * as api from "@/lib/api";
import { useUIStrings } from "@/contexts/UIStringsContext";

interface WorldTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: WorldTemplate) => void;
}

const genreColors: Record<string, string> = {
  fantasy: "--amber",
  scifi: "--arcane",
  horror: "--crimson",
  mystery: "--fog",
  romance: "--text",
  adventure: "--amber",
  default: "--mist",
};

export function WorldTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: WorldTemplatesModalProps) {
  const { t } = useUIStrings();
  const [templates, setTemplates] = useState<WorldTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorldTemplate | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await api.getWorldTemplates();
        setTemplates(data);
      } catch (err) {
        console.error("[Templates] Failed to fetch:", err);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  const getGenreColor = (genre: string) => {
    return genreColors[genre.toLowerCase()] || genreColors.default;
  };

  const handleSelect = (template: WorldTemplate) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--void)] border border-[var(--stone)] rounded-lg overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--slate)]">
          <h2 className="text-[var(--amber)] font-bold tracking-wider">WORLD TEMPLATES</h2>
          <button
            onClick={onClose}
            className="text-[var(--mist)] hover:text-[var(--text)] transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--mist)] animate-pulse">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-[var(--mist)]">
              <p>{t("no_templates_available")}</p>
              <p className="text-sm mt-2">{t("check_back_later")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => {
                const isSelected = selectedTemplate?.slug === template.slug;
                return (
                  <button
                    key={template.slug}
                    onClick={() => handleSelect(template)}
                    className={`
                      text-left p-4 rounded-lg border transition-all
                      ${isSelected
                        ? "border-[var(--amber)] bg-[var(--stone)]"
                        : "border-[var(--slate)] bg-[var(--shadow)] hover:border-[var(--amber-dim)]"
                      }
                    `}
                  >
                    {/* Template Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-[var(--text)] font-medium">{template.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          color: `var(${getGenreColor(template.genre)})`,
                          backgroundColor: `var(${getGenreColor(template.genre)})/10`,
                        }}
                      >
                        {template.genre}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[var(--mist)] text-sm mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-[var(--mist)]">
                      <span>{template.fork_count} forks</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Template Details */}
        {selectedTemplate && (
          <div className="p-4 border-t border-[var(--slate)] bg-[var(--shadow)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--text)] font-medium">{selectedTemplate.name}</div>
                <div className="text-[var(--mist)] text-sm">{selectedTemplate.description}</div>
              </div>
              {onSelectTemplate && (
                <button
                  onClick={handleUseTemplate}
                  className="px-4 py-2 bg-[var(--amber)] text-[var(--void)] rounded font-medium hover:bg-[var(--amber-dim)] transition-colors"
                >
                  Use Template
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[var(--slate)]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[var(--shadow)] border border-[var(--slate)] rounded text-[var(--mist)] hover:text-[var(--text)] hover:border-[var(--amber-dim)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
