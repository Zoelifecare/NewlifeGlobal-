"use client";
import { startTransition, useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ServiceTime, SiteSettings } from "@/lib/content/types";
import { saveSettings } from "@/lib/admin/site-actions";
import { btnPrimary, inputCls } from "./ui";

export function SettingsForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const [services, setServices] = useState<ServiceTime[]>(s.services);
  const [social, setSocial] = useState(s.social);

  const F = ({ name, label, value, type = "text", max = 200 }: { name: string; label: string; value?: string | null; type?: string; max?: number }) => (
    // plain helper (called, not rendered as a component) so inputs keep their state across re-renders
    <label className="grid gap-1 text-sm font-medium">{label}<input name={name} type={type} defaultValue={value ?? ""} maxLength={max} className={inputCls} /></label>
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}
      className="grid gap-6"
    >
      <input type="hidden" name="services" value={JSON.stringify(services)} />
      <input type="hidden" name="social" value={JSON.stringify(social)} />

      <Section title="Identity">
        {F({ name: "name", label: "Church name", value: s.name, max: 80, })}
        {F({ name: "short_name", label: "Short name", value: s.shortName, max: 80, })}
        {F({ name: "tagline", label: "Tagline", value: s.tagline, max: 120, })}
        {F({ name: "affiliation", label: "Affiliation line", value: s.affiliation, max: 200, })}
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">Pillars (one per line)<textarea name="pillars" rows={3} defaultValue={s.pillars.join("\n")} className={inputCls} /></label>
        {F({ name: "verse_ref", label: "Anchor verse reference", value: s.verse.ref, max: 60, })}
        <label className="grid gap-1 text-sm font-medium sm:col-span-2">Anchor verse text<textarea name="verse_text" rows={2} defaultValue={s.verse.text} maxLength={500} className={inputCls} /></label>
      </Section>

      <Section title="Address">
        {F({ name: "address_line1", label: "Street", value: s.address.line1, max: 120, })}
        {F({ name: "address_city", label: "City", value: s.address.city, max: 80, })}
        {F({ name: "address_region", label: "State", value: s.address.region, max: 20, })}
        {F({ name: "address_postal", label: "ZIP", value: s.address.postal, max: 20, })}
      </Section>

      <Section title="Public contact details" note="Leave empty to hide. The church email will be created on the new domain.">
        {F({ name: "contact_email", label: "Email", type: "email", value: s.contact.email, max: 254, })}
        {F({ name: "contact_phone", label: "Phone", type: "tel", value: s.contact.phone, max: 40, })}
      </Section>

      <Section title="Service times" wide>
        <div className="grid gap-3 sm:col-span-2">
          {services.map((x, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
              {(["name", "day", "time", "location", "note"] as const).map((k) => (
                <input key={k} aria-label={k} placeholder={k[0].toUpperCase() + k.slice(1)} value={x[k] ?? ""} maxLength={160}
                  onChange={(e) => setServices(services.map((y, j) => (j === i ? { ...y, [k]: e.target.value } : y)))} className={inputCls} />
              ))}
              <button type="button" onClick={() => setServices(services.filter((_, j) => j !== i))} aria-label="Remove service" className="rounded-md border border-line px-3 text-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setServices([...services, { name: "", day: "", time: "", location: "" }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add service</button>
        </div>
      </Section>

      <Section title="Social media & links" wide>
        <div className="grid gap-3 sm:col-span-2">
          {social.map((x, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <input aria-label="Label" placeholder="Label" value={x.label} maxLength={60} onChange={(e) => setSocial(social.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} className={inputCls} />
              <input aria-label="URL" placeholder="https://" value={x.url} maxLength={300} onChange={(e) => setSocial(social.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} className={inputCls} />
              <button type="button" onClick={() => setSocial(social.filter((_, j) => j !== i))} aria-label="Remove link" className="rounded-md border border-line px-3 text-muted hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={() => setSocial([...social, { label: "", url: "" }])} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-deep"><Plus className="h-4 w-4" />Add link</button>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-[#f4f6f9]/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <button type="submit" disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save settings"}</button>
        {state && <p role="status" className={`text-sm ${state.ok ? "text-blue-deep" : "text-red-700"}`}>{state.message}</p>}
      </div>
    </form>
  );
}

function Section({ title, note, children, wide }: { title: string; note?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-line bg-white p-5 sm:grid-cols-2 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <div className="sm:col-span-2"><h2 className="font-semibold">{title}</h2>{note && <p className="text-xs text-muted">{note}</p>}</div>
      {children}
      {wide ? null : null}
    </fieldset>
  );
}
