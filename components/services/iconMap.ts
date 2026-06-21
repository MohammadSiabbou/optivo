/**
 * Maps known Lucide icon name strings to their imported components.
 * Used by ServiceCard so we never do arbitrary dynamic imports.
 * Falls back to Camera for any unrecognised name.
 */
import {
  Camera,
  Sun,
  User,
  PartyPopper,
  HeartHandshake,
  Package,
  Building2,
  Plane,
  Baby,
  Shirt,
  Clapperboard,
  Gauge,
  Video,
  Megaphone,
  Music,
  Smartphone,
  Star,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Camera,
  Sun,
  User,
  PartyPopper,
  HeartHandshake,
  Package,
  Building2,
  Plane,
  Baby,
  Shirt,
  Clapperboard,
  Gauge,
  Video,
  Megaphone,
  Music,
  Smartphone,
  Star,
}

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Camera
}
