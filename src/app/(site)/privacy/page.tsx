import type { Metadata } from "next";
import { getSettings } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };
export const revalidate = 3600;

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <section className="pb-24 pt-[calc(var(--nl-header-h)+4rem)]">
      <div className="nl-container max-w-3xl">
        <p className="nl-label mb-6">Privacy</p>
        <h1 className="nl-h1 mb-10">How we handle your information</h1>
        <div className="grid gap-5 text-body [&_h2]:mt-6">
          <p>{s.name} collects only the information you choose to send us through this website.</p>
          <h2 className="nl-h3">Prayer requests</h2>
          <p>Prayer requests are confidential. Name and email are optional. Requests are visible only to authorised pastoral staff, are never published, and are never shared with third parties. We contact you only if you tick the box giving us permission.</p>
          <h2 className="nl-h3">Contact and visit forms</h2>
          <p>Messages you send are stored securely and read by church staff so we can reply. We do not sell or share your details.</p>
          <h2 className="nl-h3">Email updates</h2>
          <p>If you subscribe, we use your email only to send church updates. You can ask to be removed at any time.</p>
          <h2 className="nl-h3">Embedded content</h2>
          <p>Videos (YouTube) and maps (Google Maps) load only when you press play or “Show map”. Those services may then set their own cookies.</p>
          <h2 className="nl-h3">Security</h2>
          <p>Form submissions are protected against spam and abuse. We store an irreversible hash of your network address for a short time to limit repeated submissions; we never store it in readable form.</p>
          <h2 className="nl-h3">Questions</h2>
          <p>To ask about or remove your information, use our contact page.</p>
        </div>
      </div>
    </section>
  );
}
