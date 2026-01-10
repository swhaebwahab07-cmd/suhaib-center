"use client";

import { memo, useState, useMemo } from "react";
import { X, Upload, Layout } from "lucide-react";
import Image from "next/image";
import { BACKGROUND_COLORS, GRADIENT_HEX_MAP, DEFAULT_FOOTER_PHONE } from "../modal-constants";
import { TEMPLATE_OPTIONS, type TemplateKey } from "@/lib/templates/config";
import { TemplateSelector } from "../TemplateSelector";

interface BasicInfoStepProps {
  profileImagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  name: string;
  subtitle: string;
  slug: string;
  backgroundColor: string;
  templateKey: TemplateKey;
  footerText: string;
  footerPhone: string;
  footerHidden: boolean;
  errors: {
    name?: string;
    slug?: string;
    backgroundColor?: string;
    templateKey?: string;
    footerPhone?: string;
    image?: string;
  };
  touched: {
    name?: boolean;
    slug?: boolean;
    backgroundColor?: boolean;
    templateKey?: boolean;
    footerPhone?: boolean;
  };
  imageError?: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onSubtitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onBackgroundColorChange: (value: string) => void;
  onBackgroundColorBlur: () => void;
  onTemplateKeyChange: (value: TemplateKey) => void;
  onFooterTextChange: (value: string) => void;
  onFooterPhoneChange: (value: string) => void;
  onFooterHiddenChange: (value: boolean) => void;
}

// Memoized color button component
const ColorButton = memo(function ColorButton({
  color,
  isSelected,
  hasError,
  onClick,
  onBlur,
}: {
  color: typeof BACKGROUND_COLORS[0];
  isSelected: boolean;
  hasError: boolean;
  onClick: () => void;
  onBlur: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={onBlur}
      className={`relative h-8 w-full overflow-hidden rounded-md border-2 transition-all duration-200 ${
        isSelected
          ? "border-sky-500 scale-110 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/30 z-10"
          : hasError
          ? "border-red-300 ring-2 ring-red-300/20"
          : "border-gray-300 hover:border-gray-400 hover:scale-105"
      }`}
      title={color.name}
    >
      {color.isSolid ? (
        <div 
          className="background-swatch h-full w-full rounded" 
          style={{ background: color.value }} 
        />
      ) : (
        <div
          className="background-swatch h-full w-full rounded"
          style={{
            background: GRADIENT_HEX_MAP[color.value]
              ? `linear-gradient(to bottom right, ${GRADIENT_HEX_MAP[color.value].from}, ${GRADIENT_HEX_MAP[color.value].via}, ${GRADIENT_HEX_MAP[color.value].to})`
              : color.value,
          }}
        />
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.color.id === nextProps.color.id
  );
});

ColorButton.displayName = "ColorButton";

export const BasicInfoStep = memo(function BasicInfoStep({
  profileImagePreview,
  fileInputRef,
  name,
  subtitle,
  slug,
  backgroundColor,
  templateKey,
  footerText,
  footerPhone,
  footerHidden,
  errors,
  touched,
  imageError,
  onImageChange,
  onRemoveImage,
  onNameChange,
  onNameBlur,
  onSubtitleChange,
  onSlugChange,
  onBackgroundColorChange,
  onBackgroundColorBlur,
  onTemplateKeyChange,
  onFooterTextChange,
  onFooterPhoneChange,
  onFooterHiddenChange,
}: BasicInfoStepProps) {
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  
  // Memoize selected template lookup
  const selectedTemplate = useMemo(() => {
    return TEMPLATE_OPTIONS.find(t => t.id === templateKey);
  }, [templateKey]);

  return (
    <>
      <div className="space-y-5">
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <label className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-gray-300 bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:scale-105 group block shadow-md">
            <Image
              src={profileImagePreview || "/images/DefaultAvatar.png"}
              alt="Profile preview"
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
          {((profileImagePreview && profileImagePreview !== "/images/DefaultAvatar.png")) && (
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-sky-400 hover:bg-sky-500 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg z-10"
              aria-label="Remove image"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <label className="group relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg sm:rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200" style={{ background: '#87CEEB' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#6BB6D6'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#87CEEB'; }}>
          <Upload className="h-4 w-4" />
          <span>وێنەی پڕۆفایل هەڵبژێرە</span>
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        {imageError && (
          <p className="text-xs text-red-500 mt-1 font-kurdish text-center">{imageError}</p>
        )}
      </div>

      {/* Name and Subtitle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700">
            ناو <span className="text-sky-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            required
            className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
              errors.name && touched.name
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-gray-300 focus:border-sky-400 focus:ring-sky-400/30 hover:border-gray-400"
            }`}
            placeholder="ناوی لینک"
          />
          {errors.name && touched.name && (
            <p className="text-xs text-red-500 mt-1 font-kurdish">{errors.name}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="subtitle" className="block text-xs sm:text-sm font-medium text-gray-700">
            ناونیشانی کورت
          </label>
          <input
            id="subtitle"
            type="text"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 hover:border-gray-400"
            placeholder="ناونیشانی کورت"
          />
        </div>
      </div>

      {/* Slug and Template Style - Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Slug */}
        <div className="space-y-1.5">
          <label htmlFor="slug" className="block text-xs sm:text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            disabled
            className={`w-full rounded-lg sm:rounded-xl border bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 cursor-not-allowed ${
              errors.slug && touched.slug
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
            }`}
            placeholder="slug"
          />
          {errors.slug && touched.slug && (
            <p className="text-xs text-red-500 mt-1 font-kurdish">{errors.slug}</p>
          )}
        </div>

        {/* Template Style */}
        <div className="space-y-1.5" data-template-section>
          <label className="block text-xs sm:text-sm font-medium text-gray-700">
            شێوازی پەڕە <span className="text-sky-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setIsTemplateSelectorOpen(true)}
            className={`relative w-full rounded-lg sm:rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-left transition-all duration-200 flex items-center justify-between gap-2 ${
              errors.templateKey && touched.templateKey
                ? "border-red-400"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {selectedTemplate ? (
              <span className="text-gray-900 truncate">{selectedTemplate.name}</span>
            ) : (
              <span className="text-gray-400">شێوازێک هەڵبژێرە</span>
            )}
            <Layout className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </button>
          {errors.templateKey && touched.templateKey && (
            <p className="text-xs text-red-500 mt-1 font-kurdish">{errors.templateKey}</p>
          )}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          ڕەنگی پاشبنەوە
        </label>
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1.5">
          {BACKGROUND_COLORS.map((color) => (
            <ColorButton
              key={color.id}
              color={color}
              isSelected={backgroundColor === color.id}
              hasError={!!(errors.backgroundColor && touched.backgroundColor)}
              onClick={() => onBackgroundColorChange(color.id)}
              onBlur={onBackgroundColorBlur}
            />
          ))}
        </div>
        {errors.backgroundColor && touched.backgroundColor && (
          <p className="text-xs text-red-500 mt-1 font-kurdish">{errors.backgroundColor}</p>
        )}
      </div>

      {/* Footer Name and Phone */}
      <div className="space-y-3 sm:space-y-4">
        {/* Hide Footer Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50">
          <input
            id="footerHidden"
            type="checkbox"
            checked={footerHidden}
            onChange={(e) => onFooterHiddenChange(e.target.checked)}
            className="h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-300 text-sky-500 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="footerHidden" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer flex-1">
            فوتەر بشارەوە (فوتەر لە پەڕەکە نیشان نادرێت)
          </label>
        </div>

        {!footerHidden && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
              <label htmlFor="footerText" className="block text-xs sm:text-sm font-medium text-gray-700">
            ناوی فوتەر (کلیک بکە بۆ واتساپ)
          </label>
          <input
            id="footerText"
            type="text"
            value={footerText}
            onChange={(e) => onFooterTextChange(e.target.value)}
                className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 hover:border-gray-400"
            placeholder="Suhaib"
          />
              <p className="text-[10px] text-gray-600 font-kurdish">
            ناوی دەرکەوتوو لە فوتەر (کلیک بکە بۆ واتساپ)
          </p>
        </div>
        <div className="space-y-1.5">
              <label htmlFor="footerPhone" className="block text-xs sm:text-sm font-medium text-gray-700">
            ژمارەی واتساپ (ئیختیاری)
          </label>
          <input
            id="footerPhone"
            type="text"
            value={footerPhone}
            onChange={(e) => onFooterPhoneChange(e.target.value)}
                className={`w-full rounded-lg sm:rounded-xl border bg-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 ${
              errors.footerPhone && touched.footerPhone
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                    : "border-gray-300 focus:border-sky-400 focus:ring-sky-400/30 hover:border-gray-400"
            }`}
            placeholder={DEFAULT_FOOTER_PHONE}
          />
          {errors.footerPhone && touched.footerPhone && (
                <p className="text-xs text-red-500 mt-1 font-kurdish">{errors.footerPhone}</p>
          )}
              <p className="text-[10px] text-gray-600 font-kurdish">
            ژمارەکە لە پەڕەکە نیشان نادرێت؛ تەنها کلیک لە ناوەکە واتساپ دەکرێت.
          </p>
              <p className="text-[10px] text-gray-600 font-kurdish">
            ئەگەر بەتاڵ بێت، {DEFAULT_FOOTER_PHONE} بەکاردێت.
          </p>
        </div>
          </div>
        )}
      </div>
    </div>

    <TemplateSelector
      isOpen={isTemplateSelectorOpen}
      onClose={() => setIsTemplateSelectorOpen(false)}
      selectedTemplate={templateKey}
      onSelectTemplate={onTemplateKeyChange}
    />
    </>
  );
});
