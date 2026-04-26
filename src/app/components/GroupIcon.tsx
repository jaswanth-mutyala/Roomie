import { Home, Palmtree, Utensils, Sparkles, Car, Gamepad2, Briefcase, Coffee, Heart, Plane, Music, Video, Zap, GraduationCap, Mountain, Tent, Building } from "lucide-react";
import React from "react";

export const ICONS_MAP: Record<string, React.ElementType> = {
  Home,
  Palmtree,
  Utensils,
  Sparkles,
  Car,
  Gamepad2,
  Briefcase,
  Coffee,
  Heart,
  Plane,
  Music,
  Video,
  Zap,
  GraduationCap,
  Mountain,
  Tent,
  Building
};

export const GROUP_ICONS = Object.keys(ICONS_MAP);

export function GroupIcon({ icon, size = 20, className = "" }: { icon: string, size?: number, className?: string }) {
  const Icon = ICONS_MAP[icon];
  if (Icon) return <Icon size={size} className={className} />;
  return <span style={{ fontSize: size }}>{icon}</span>;
}
