import {
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Repeat,
  Users,
  type LucideIcon,
} from "lucide-react";

// Sidebar navigation items, in display order.
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/class-sessions", label: "Class Sessions", icon: CalendarDays },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/credit-ledgers", label: "Credit Ledgers", icon: BookOpen },
  { href: "/compensations", label: "Compensations", icon: Repeat },
  { href: "/branches", label: "Branches", icon: Building2 },
  { href: "/staffs", label: "Staffs", icon: Users },
];
