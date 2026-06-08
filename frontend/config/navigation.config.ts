// Sidebar navigation items, in display order.
export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/class-sessions", label: "Class Sessions" },
  { href: "/students", label: "Students" },
  { href: "/credit-ledgers", label: "Credit Ledgers" },
  { href: "/compensations", label: "Compensations" },
  { href: "/branches", label: "Branches" },
  { href: "/staffs", label: "Staffs" },
];
