import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Membership, Organization } from "@/lib/types";

/**
 * Server-side helper: returns the signed-in user's current organization + membership.
 * v1 assumes one org per user. Redirects to /onboarding if no org exists yet.
 */
export async function requireOrgContext(): Promise<{
  membership: Membership;
  org: Organization;
  userId: string;
}> {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.org_id)
    .single();

  if (!org) redirect("/onboarding");

  return { membership: membership as Membership, org: org as Organization, userId: user.id };
}
