"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Layout, Check, Sparkles } from "lucide-react";
import { TEMPLATE_OPTIONS, type TemplateKey } from "@/lib/templates/config";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: TemplateKey;
  onSelectTemplate: (template: TemplateKey) => void;
}

// Compact template card - simple and small
const TemplateCard = memo(function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: (typeof TEMPLATE_OPTIONS)[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative aspect-[4/3] w-full overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-sky-500 shadow-lg ring-2 ring-sky-500/50 scale-105"
          : "border-gray-300 hover:border-gray-400 hover:shadow-md hover:scale-102"
      }`}
      aria-pressed={isSelected}
    >
      {/* Background gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${template.previewGradient} transition-opacity duration-200 ${
          isSelected ? "opacity-95" : "opacity-70 group-hover:opacity-85"
        }`}
        aria-hidden
      />
      
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" aria-hidden />
      
      {/* Content - compact */}
      <div className="relative flex flex-col items-center justify-center gap-1.5 p-2 h-full">
        {/* Icon */}
        <div className={`rounded-md p-1.5 backdrop-blur-sm transition-all duration-200 ${
          isSelected 
            ? "bg-white/30 scale-110" 
            : "bg-white/10 group-hover:bg-white/20 group-hover:scale-105"
        }`}>
          <Layout className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
        </div>
        
        {/* Template name */}
        <span className={`text-[10px] sm:text-xs font-semibold text-white text-center transition-colors duration-200 leading-tight ${
          isSelected ? "text-yellow-300" : ""
        }`}>
          {template.name}
        </span>
        
        {/* Selection checkmark */}
        {isSelected && (
          <div className="absolute top-1 right-1 rounded-full bg-sky-500 p-0.5 shadow-lg">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.template.id === nextProps.template.id
  );
});

TemplateCard.displayName = "TemplateCard";

export const TemplateSelector = memo(function TemplateSelector({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Add keyframes to document if not already present - must be before any conditional returns
  useEffect(() => {
    if (!isOpen || !mounted) return;
    
    const styleId = 'template-selector-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Don't remove style on cleanup to avoid flicker
    };
  }, [isOpen, mounted]);

  const handleSelect = useCallback((templateId: TemplateKey) => {
    onSelectTemplate(templateId);
    onClose();
  }, [onSelectTemplate, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />
      
      {/* Modal container */}
      <div 
        className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[85vw] md:w-[80vw] lg:w-[70vw] max-w-4xl max-h-[90vh] overflow-hidden rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-xl animate-in fade-in zoom-in-95 duration-300"
        dir="ltr"
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-50 border border-sky-200 p-2">
                <Sparkles className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  شێوازی پەڕە هەڵبژێرە
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {TEMPLATE_OPTIONS.length} شێواز
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content - Centered */}
        <div 
          className="overflow-y-auto p-3 sm:p-4 flex items-center justify-center bg-white"
          style={{ 
            scrollbarWidth: "thin", 
            scrollbarColor: "rgba(156,163,175,0.5) transparent",
            maxHeight: "calc(90vh - 100px)",
            minHeight: "400px",
          }}
        >
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5 justify-items-center">
              {TEMPLATE_OPTIONS.map((template, index) => (
                <div
                  key={template.id}
                  className="w-full max-w-[100px] sm:max-w-[110px] md:max-w-[120px]"
                  style={{
                    animation: `fadeInUp 0.3s ease-out ${index * 0.03}s both`,
                  }}
                >
                  <TemplateCard
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onSelect={() => handleSelect(template.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.selectedTemplate === nextProps.selectedTemplate
  );
});

TemplateSelector.displayName = "TemplateSelector";
