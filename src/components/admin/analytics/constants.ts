import type { ComponentType, SVGProps } from "react";
import { BarChart3 } from "lucide-react";

export type TabType = "overview";

export type TabDefinition = {
  id: TabType;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const TABS: TabDefinition[] = [
  { id: "overview", label: "گشتی", icon: BarChart3 },
];
