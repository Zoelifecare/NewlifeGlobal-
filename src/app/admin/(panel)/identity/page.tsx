import Link from "next/link";
import { requireCapability } from "@/lib/auth/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/content";
import { loadMediaLibrary } from "@/lib/admin/loaders";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { ContentWorkflow, type ContentRow, type VersionRow } from "@/components/admin/content-workflow";
import { FaqEditor, GivingEditor, NavigationEditor } from "@/components/admin/identity-editors";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "content", label: "Church content", help: "About, story, mission, vision, values, beliefs, visit & giving text" },
  { id: "church", label: "Church info & contact", help: "Name, logo, address, service times, contact, social" },
  { id: "giving", label: "Giving", help: "Approved giving methods and links" },
  { id: "visit", label: "Plan Your Visit FAQ", help: "Questions and answers" },
  { id: "navigation", label: "Navigation & pages", help: "Menus and page visibility" },
] as const;

export default async function IdentityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const staff = await requireCapability("content");
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab! : "content";
  const supabase = await createSupabaseServerClient();
  const settings = await getSettings();

  let content: ContentRow[] = [];
  let versions: VersionRow[] = [];
  let names: Record<string, string> = {};
  if (tab === "content" || tab === "church") {
    const [{ data: c }, { data: v }, { data: p }] = await Promise.all([
      supabase.from("church_content").select("key, label, sort_order, requires_approval, draft, published, status, review_note, submitted_at, published_at, updated_at").order("sort_order"),
      supabase.from("content_versions").select("id, entity, entity_key, event, data, actor_id, note, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("profiles").select("id, full_name, email"),
    ]);
    content = (c ?? []) as ContentRow[];
    versions = (v ?? []) as VersionRow[];
    names = Object.fromEntries((p ?? []).map((x) => [x.id, x.full_name || x.email || "Staff"]));
  }
  const logos = tab === "church" ? (await loadMediaLibrary()).map((m) => ({ url: m.url, alt: m.alt })) : [];

  return (
    <>
      <PageTitle
        title="Church Identity & Settings"
        description="The official information about New Life Global. Mission, vision, beliefs and the church story need a super admin's approval before they appear on the website; every change is versioned and logged."
      />
      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-2 border-b border-line pb-4">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/identity?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined} title={t.help}
            className={`rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "bg-blue-deep text-white" : "bg-white text-ink hover:bg-mist"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "content" && (
        <ContentWorkflow rows={content} versions={versions.filter((v) => v.entity === "church_content")} names={names} isAdmin={staff.isAdmin} />
      )}
      {tab === "church" && (
        <div className="grid gap-8">
          <SettingsForm s={settings} logos={logos} />
          <SettingsHistory versions={versions.filter((v) => v.entity === "site_settings")} names={names} />
        </div>
      )}
      {tab === "giving" && <GivingEditor initial={settings.giving} />}
      {tab === "visit" && <FaqEditor initial={settings.visitFaq} />}
      {tab === "navigation" && <NavigationEditor initialNav={settings.navigation} initialPages={settings.pages} />}
    </>
  );
}

async function SettingsHistory({ versions, names }: { versions: VersionRow[]; names: Record<string, string> }) {
  const { SettingsVersionList } = await import("@/components/admin/content-workflow");
  return <SettingsVersionList versions={versions.slice(0, 30)} names={names} />;
}
