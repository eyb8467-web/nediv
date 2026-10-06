export type Membership = {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "staff";
  title: string | null;
  perms: Record<string, boolean>;
};

export type Organization = {
  id: string;
  name: string;
  org_number: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  donate_banner_url: string | null;
  kiosk_image_url: string | null;
};

export type Donor = {
  id: string;
  org_id: string;
  acct_number: string | null;
  first_name: string | null;
  last_name: string | null;
  family_name: string | null;
  first_name_hebrew: string | null;
  last_name_hebrew: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  father_name: string | null;
  default_location_id: string | null;
  group: string | null;
  member_type: string | null;
  member_since: string | null;
  collection: string | null;
  call_results: string | null;
  note: string | null;
  locker_waiting_list: boolean;
  seat_waiting_list: boolean;
  seat_plate: string | null;
  status: string;
  created_at: string;
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/lists/donors", label: "Lists", icon: "list", matchPrefix: "/lists" },
  { href: "/transactions/payments", label: "Transactions", icon: "banknote", matchPrefix: "/transactions" },
  { href: "/reports/query", label: "Reports", icon: "bar-chart-2", matchPrefix: "/reports" },
  { href: "/notifications/alerts", label: "Notifications", icon: "bell", matchPrefix: "/notifications" },
  { href: "/admin/profile", label: "Admin", icon: "settings", matchPrefix: "/admin" },
  { href: "/finance/batches", label: "Finance", icon: "wallet", matchPrefix: "/finance" },
] as const;
