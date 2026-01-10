'use client';

import { memo } from "react";
import type { ComponentType, SVGProps } from "react";

export type StatCardColor = "blue" | "green" | "purple" | "orange" | "cyan";

interface StatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number | string;
  color?: StatCardColor;
  subtitle?: string;
}

export const StatCard = memo(function StatCard({ icon: Icon, label, value, color = "blue", subtitle }: StatCardProps) {
  const colorClasses: Record<StatCardColor, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
  };

  const iconBgClasses: Record<StatCardColor, string> = {
    blue: "bg-blue-100 border-blue-300",
    green: "bg-green-100 border-green-300",
    purple: "bg-purple-100 border-purple-300",
    orange: "bg-orange-100 border-orange-300",
    cyan: "bg-cyan-100 border-cyan-300",
  };

  const iconColorClasses: Record<StatCardColor, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    cyan: "text-cyan-600",
  };

  return (
    <div className={`group relative rounded-xl ${colorClasses[color]} p-5 sm:p-6 border transition-all duration-200 hover:shadow-md overflow-hidden`}>
      <div className="relative flex items-center gap-4">
        <div className={`p-3 rounded-lg ${iconBgClasses[color]} border group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColorClasses[color]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl font-bold font-kurdish mb-1 text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</div>
          <div className="text-xs sm:text-sm text-gray-700 font-kurdish font-medium">{label}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 font-kurdish mt-1.5">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
});
