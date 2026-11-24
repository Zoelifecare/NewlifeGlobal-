"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Banknote, CalendarHeart, Check, CheckCircle2, Copy, HandCoins, Landmark, Lock, Smartphone } from "lucide-react";
import type { GivingCatalog, PaymentMethodPublic } from "@/lib/content/types";

/* ------------------------------------------------------------------ shared bits */
const PRESETS = [25, 50, 100, 250, 500];
const FREQ = [
  { v: "one_time", l: "One time" }, { v: "weekly", l: "Weekly" }, { v: "monthly", l: "Monthly" },
  { v: "quarterly", l: "Quarterly" }, { v: "annually", l: "Yearly" },
] as const;
type Freq = (typeof FREQ)[number]["v"];
const CONFIRM_KIND: Partial<Record<PaymentMethodPublic["kind"], string>> = {
  zelle: "zelle_confirmation", cashapp: "cashapp_confirmation", bank_transfer: "bank_transfer_confirmation", cash_drop: "cash_drop_notice",
};
const ICON: Record<string, React.ElementType> = { online_link: HandCoins, zelle: Smartphone, cashapp: Smartphone, bank_transfer: Landmark, cash_drop: Banknote, check: Banknote, other: HandCoins };

interface Result { ok: boolean; message: string; reference?: string; fieldErrors?: Record<string, string> }

function useSubmit(kind: "pledge" | "donation" | "confirmation") {
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error"; result?: Result }>({ status: "idle" });
  const submit = async (body: Record<string, unknown>, form?: HTMLFormElement) => {
    setState({ status: "sending" });
    const website = (form?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    try {
      const res = await fetch(`/api/giving/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, website, startedAt: startedAt.current }) });
      const result = (await res.json()) as Result;
      setState({ status: result.ok ? "done" : "error", result });
      return result;
    } catch {
      const result = { ok: false, message: "Network error. Please check your connection and try again." };
      setState({ status: "error", result });
      return result;
    }
  };
  return { state, submit, err: (n: string) => state.result?.fieldErrors?.[n] };
}

function AmountPicker({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const custom = value !== "" && !PRESETS.includes(Number(value));
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 text-sm font-semibold text-ink">Amount</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => onChange(String(p))} aria-pressed={Number(value) === p}
            className={`nl-hoverbox border py-4 text-lg font-medium tracking-tight transition-colors ${Number(value) === p ? "border-blue-deep bg-blue-deep text-white" : "border-line bg-white text-ink hover:border-blue"}`}>
            ${p}
          </button>
        ))}
        <label className={`relative col-span-3 flex items-center border sm:col-span-1 ${custom ? "border-blue-deep" : "border-line"} bg-white`}>
          <span className="pl-3 text-lg text-muted" aria-hidden>$</span>
          <input inputMode="decimal" aria-label="Custom amount" placeholder="Other" value={custom ? value : ""} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full bg-transparent px-2 py-4 text-lg text-ink outline-none" />
        </label>
      </div>
      {error && <p className="nl-error">{error}</p>}
    </fieldset>
  );
}

function FrequencyPicker({ value, onChange, allowRecurring = true }: { value: Freq; onChange: (v: Freq) => void; allowRecurring?: boolean }) {
  const opts = allowRecurring ? FREQ : FREQ.filter((f) => f.v === "one_time");
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink">How often?</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {opts.map((f) => (
          <button key={f.v} type="button" role="radio" aria-checked={value === f.v} onClick={() => onChange(f.v)}
            className={`border px-4 py-2.5 text-sm transition-colors ${value === f.v ? "border-blue-deep bg-blue-deep text-white" : "border-line bg-white text-ink hover:border-blue"}`}>
            {f.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Input({ label, name, value, onChange, error, type = "text", required, hint, ...rest }: {
  label: string; name: string; value: string; onChange: (v: string) => void; error?: string; type?: string; required?: boolean; hint?: string;
} & Record<string, unknown>) {
  const id = `g-${name}`;
  return (
    <div className="nl-field">
      <label htmlFor={id}>{label}{required ? <span aria-hidden className="text-blue-deep"> *</span> : <span className="font-normal text-muted"> (optional)</span>}</label>
      {type === "textarea"
        ? <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className="nl-input !min-h-24" aria-invalid={error ? true : undefined} {...rest} />
        : <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="nl-input" aria-invalid={error ? true : undefined} required={required} {...rest} />}
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="nl-error">{error}</p>}
    </div>
  );
}

function Designation({ catalog, value, onChange }: { catalog: GivingCatalog; value: string; onChange: (v: string) => void }) {
  if (!catalog.designations.length) return null;
  return (
    <div className="nl-field">
      <label htmlFor="g-designation">Give toward</label>
      <select id="g-designation" value={value} onChange={(e) => onChange(e.target.value)} className="nl-input">
        <option value="">General giving</option>
        {catalog.designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </div>
  );
}

function Honeypot() {
  const id = useId();
  return <div className="nl-hp" aria-hidden="true"><label htmlFor={id}>Website</label><input id={id} name="website" tabIndex={-1} autoComplete="off" /></div>;
}

function Done({ title, result, children }: { title: string; result?: Result; children?: React.ReactNode }) {
  return (
    <div role="status" className="grid justify-items-start gap-4 border border-blue/40 bg-blue-mist p-[clamp(1.5rem,4vw,2.5rem)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-deep text-white"><CheckCircle2 className="h-6 w-6" aria-hidden /></span>
      <h3 className="nl-h3">{title}</h3>
      <p className="m-0 text-ink">{result?.message}</p>
      {result?.reference && <p className="m-0 text-sm text-body">Your reference: <strong className="nl-num text-ink">{result.reference}</strong></p>}
      {children}
    </div>
  );
}

function CopyText({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); }); }}
      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-deep hover:text-blue" aria-label={`Copy ${text}`}>
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}{done ? "Copied" : "Copy"}
    </button>
  );
}

/* ------------------------------------------------------------------ open the app / bank */
/** Official sites of common US banks. On phones, many of these open the bank's installed app. */
const BANKS: { name: string; url: string }[] = [
  { name: "Chase", url: "https://www.chase.com" },
  { name: "Bank of America", url: "https://www.bankofamerica.com" },
  { name: "Wells Fargo", url: "https://www.wellsfargo.com" },
  { name: "Citi", url: "https://www.citi.com" },
  { name: "Capital One", url: "https://www.capitalone.com" },
  { name: "U.S. Bank", url: "https://www.usbank.com" },
  { name: "PNC", url: "https://www.pnc.com" },
  { name: "Truist", url: "https://www.truist.com" },
  { name: "Navy Federal", url: "https://www.navyfederal.org" },
  { name: "USAA", url: "https://www.usaa.com" },
  { name: "Desert Financial", url: "https://www.desertfinancial.com" },
  { name: "OneAZ Credit Union", url: "https://www.oneazcu.com" },
];

/** Cash App: https://cash.app/$tag[/amount] opens the app when installed, otherwise Cash App on the web. */
export function cashAppUrl(handle: string, amount?: string) {
  const tag = handle.trim().replace(/^\$?/, "$").replace(/\s+/g, "");
  const n = Number(amount);
  return `https://cash.app/${encodeURIComponent(tag).replace("%24", "$")}${Number.isFinite(n) && n >= 1 ? `/${n}` : ""}`;
}

function BankPicker({ title, note }: { title: string; note: string }) {
  return (
    <div className="grid gap-3 border border-line bg-paper p-4">
      <p className="m-0 text-sm font-semibold text-ink">{title}</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BANKS.map((b) => (
          <li key={b.name}>
            <a href={b.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-blue-deep">
              {b.name}<ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-muted">{note}</p>
    </div>
  );
}

function PayActions({ m, amount }: { m: PaymentMethodPublic; amount?: string }) {
  const [banks, setBanks] = useState(false);
  if (m.kind === "cashapp" && m.handle) {
    return (
      <a href={cashAppUrl(m.handle, amount)} target="_blank" rel="noopener noreferrer" className="nl-btn w-fit">
        <span>Open Cash App{Number(amount) >= 1 ? ` · $${Number(amount)}` : ""}</span><ArrowUpRight className="h-4 w-4" aria-hidden />
      </a>
    );
  }
  if (m.kind === "zelle" && m.handle) {
    return (
      <div className="grid gap-3">
        <button type="button" className="nl-btn w-fit"
          onClick={() => { navigator.clipboard?.writeText(m.handle!).catch(() => {}); setBanks((v) => !v); }}>
          <span>Pay with Zelle in my bank app</span><ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        {banks && <BankPicker title={`We copied ${m.handle}. Choose your bank, open Zelle and paste it as the recipient.`} note="Zelle lives inside your bank's app. This opens your bank's official site or app; we never see your banking details." />}
      </div>
    );
  }
  if (m.kind === "bank_transfer") {
    return (
      <div className="grid gap-3">
        <button type="button" className="nl-btn w-fit" onClick={() => setBanks((v) => !v)}>
          <span>Choose my bank</span><ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        {banks && <BankPicker title="Choose your bank to sign in and send the transfer using the details above." note="Opens your bank's official site or app in a new tab. You can also transfer manually at your branch. We never see your banking details." />}
      </div>
    );
  }
  return null;
}

function MethodDetails({ m, amount }: { m: PaymentMethodPublic; amount?: string }) {
  return (
    <div className="grid gap-3">
      {m.description && <p className="m-0 text-body">{m.description}</p>}
      {(m.handle || m.kind === "zelle" || m.kind === "cashapp") && (
        <div className="flex flex-wrap items-center gap-3 border border-blue/30 bg-blue-mist px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{m.kind === "zelle" || m.kind === "cashapp" ? "Send to" : "Details"}</span>
          <span className="nl-num text-lg font-medium text-ink">{m.handle ?? "Number coming soon"}</span>
          {m.handle && <CopyText text={m.handle} />}
        </div>
      )}
      {m.location && <p className="m-0"><strong className="text-ink">Where: </strong>{m.location}</p>}
      {m.instructions && <p className="m-0 whitespace-pre-line text-body">{m.instructions}</p>}
      {m.referenceInfo && <p className="m-0 text-sm text-muted">{m.referenceInfo}</p>}
      <PayActions m={m} amount={amount} />
    </div>
  );
}

/* ------------------------------------------------------------------ confirmation form ("I've sent it" / cash drop notice) */
function ConfirmForm({ method, catalog, presetAmount = "", designation = "", onDone }: {
  method: PaymentMethodPublic; catalog: GivingCatalog; presetAmount?: string; designation?: string; onDone?: () => void;
}) {
  const { state, submit, err } = useSubmit("confirmation");
  const [f, setF] = useState({ amount: presetAmount, name: "", email: "", sentOn: "", donorReference: "", message: "", designationId: designation });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const kind = CONFIRM_KIND[method.kind];
  if (!kind) return null;
  if (state.status === "done") return <Done title="Thank you!" result={state.result}><p className="m-0 text-sm text-body">This is not a receipt. You&apos;ll hear from us once your gift is confirmed.</p></Done>;
  const cash = method.kind === "cash_drop";
  return (
    <form noValidate className="grid gap-5" onSubmit={async (e) => { e.preventDefault(); const r = await submit({ ...f, kind, methodId: method.id }, e.currentTarget); if (r.ok) onDone?.(); }}>
      <Honeypot />
      <AmountPicker value={f.amount} onChange={set("amount")} error={err("amount")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Name" name="c-name" value={f.name} onChange={set("name")} error={err("name")} autoComplete="name" maxLength={120} />
        <Input label="Email" name="c-email" type="email" value={f.email} onChange={set("email")} error={err("email")} autoComplete="email" maxLength={254} hint="For your confirmation email." />
        <Input label={cash ? "Date you dropped it" : "Date sent"} name="c-date" type="date" value={f.sentOn} onChange={set("sentOn")} error={err("sentOn")} />
        {!cash && <Input label="Memo or confirmation code" name="c-ref" value={f.donorReference} onChange={set("donorReference")} error={err("donorReference")} maxLength={120} hint="Never enter bank or card numbers." />}
      </div>
      <Designation catalog={catalog} value={f.designationId} onChange={set("designationId")} />
      <Input label="Message" name="c-msg" type="textarea" value={f.message} onChange={set("message")} error={err("message")} maxLength={2000} />
      {state.status === "error" && <p role="alert" className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.result?.message}</p>}
      <button type="submit" disabled={state.status === "sending"} className="nl-btn nl-btn--lg w-full sm:w-fit">
        <span>{state.status === "sending" ? "Sending…" : cash ? "Let us know you gave" : "I've sent my gift"}</span><ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ 01 Give now */
function GiveNow({ catalog }: { catalog: GivingCatalog }) {
  const methods = catalog.methods.filter((m) => m.kind !== "cash_drop");
  const [amount, setAmount] = useState("100");
  const [freq, setFreq] = useState<Freq>("one_time");
  const [designation, setDesignation] = useState("");
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [step, setStep] = useState<1 | 2>(1);
  const method = methods.find((m) => m.id === methodId);
  const recurringOk = methods.some((m) => m.supportsRecurring);
  const intent = useSubmit("donation");
  const [contact, setContact] = useState({ name: "", email: "" });

  if (!methods.length) {
    return (
      <Empty icon={HandCoins} title="Online giving is coming soon." text="The church is finalizing its giving options. You can make a pledge today, or contact us with any questions about giving." cta={{ label: "Contact us", href: "/contact?topic=giving" }} />
    );
  }
  const valid = Number(amount) >= 1;
  return (
    <div className="grid gap-8">
      <ol className="flex gap-6 text-xs font-bold uppercase tracking-[0.14em]" aria-label="Steps">
        {["Your gift", "How to give"].map((l, i) => (
          <li key={l} className={`flex items-center gap-2 ${step === i + 1 ? "text-blue-deep" : "text-muted"}`} aria-current={step === i + 1 ? "step" : undefined}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === i + 1 ? "border-blue-deep bg-blue-deep text-white" : "border-line"}`}>{i + 1}</span>{l}
          </li>
        ))}
      </ol>
      {step === 1 ? (
        <div className="grid gap-7">
          <AmountPicker value={amount} onChange={setAmount} />
          <FrequencyPicker value={freq} onChange={setFreq} allowRecurring={recurringOk} />
          <Designation catalog={catalog} value={designation} onChange={setDesignation} />
          <button type="button" disabled={!valid} onClick={() => setStep(2)} className="nl-btn nl-btn--lg w-full sm:w-fit"><span>Continue · ${Number(amount || 0).toLocaleString("en-US")}{freq !== "one_time" ? ` ${FREQ.find((f) => f.v === freq)?.l.toLowerCase()}` : ""}</span><ArrowRight className="h-4 w-4" aria-hidden /></button>
        </div>
      ) : (
        <div className="grid gap-6">
          <div role="radiogroup" aria-label="Payment method" className="grid gap-2 sm:grid-cols-2">
            {methods.filter((m) => freq === "one_time" || m.supportsRecurring).map((m) => {
              const Icon = ICON[m.kind] ?? HandCoins;
              return (
                <button key={m.id} type="button" role="radio" aria-checked={methodId === m.id} onClick={() => setMethodId(m.id)}
                  className={`nl-hoverbox flex items-center gap-4 border p-4 text-left transition-colors ${methodId === m.id ? "border-blue-deep" : "border-line hover:border-blue"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${methodId === m.id ? "bg-blue-deep text-white" : "bg-blue-mist text-blue-deep"}`}><Icon className="h-5 w-5" aria-hidden /></span>
                  <span className="grid"><span className="font-semibold text-ink">{m.label}</span>{m.description && <span className="text-xs text-muted">{m.description}</span>}</span>
                </button>
              );
            })}
          </div>
          {method && method.kind === "online_link" && (
            intent.state.status === "done" ? (
              <Done title="One last step" result={intent.state.result}>
                {method.url && <a href={method.url} target="_blank" rel="noopener noreferrer" className="nl-btn nl-btn--lg"><span>Continue to secure giving</span><ArrowUpRight className="h-4 w-4" aria-hidden /></a>}
                <p className="m-0 text-xs text-muted">You&apos;ll complete your gift on {method.label}&apos;s secure page. This website never asks for card or bank details.</p>
              </Done>
            ) : (
              <form noValidate className="grid gap-5" onSubmit={async (e) => { e.preventDefault(); await intent.submit({ ...contact, amount, frequency: freq, designationId: designation, methodId: method.id }, e.currentTarget); }}>
                <Honeypot />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Name" name="d-name" value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} error={intent.err("name")} autoComplete="name" maxLength={120} />
                  <Input label="Email" name="d-email" type="email" required value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} error={intent.err("email")} autoComplete="email" maxLength={254} />
                </div>
                {intent.state.status === "error" && <p role="alert" className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{intent.state.result?.message}</p>}
                <div className="flex flex-wrap items-center gap-4">
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-muted hover:text-ink">← Back</button>
                  <button type="submit" disabled={intent.state.status === "sending"} className="nl-btn nl-btn--lg"><span>{intent.state.status === "sending" ? "Saving…" : "Continue"}</span><ArrowRight className="h-4 w-4" aria-hidden /></button>
                </div>
              </form>
            )
          )}
          {method && method.kind !== "online_link" && (
            <div className="grid gap-6">
              <MethodDetails m={method} amount={amount} />
              <div className="border-t border-line pt-6">
                <p className="mb-4 text-sm text-body">After you send your gift, let us know so our finance team can confirm it.</p>
                <ConfirmForm method={method} catalog={catalog} presetAmount={amount} designation={designation} />
              </div>
              <button type="button" onClick={() => setStep(1)} className="w-fit text-sm font-semibold text-muted hover:text-ink">← Back</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ 02 Pledge */
function Pledge({ catalog }: { catalog: GivingCatalog }) {
  const { state, submit, err } = useSubmit("pledge");
  const [f, setF] = useState({ amount: "500", frequency: "one_time" as Freq, designationId: "", name: "", email: "", phone: "", intendedMethod: "", expectedBy: "", message: "" });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const methodOptions = useMemo(() => [...new Set(catalog.methods.map((m) => m.label).concat(["Cash", "Check", "Other"]))], [catalog.methods]);
  if (state.status === "done") {
    return (
      <Done title="Thank you for your pledge" result={state.result}>
        <p className="m-0 text-sm text-body"><strong>No payment has been made.</strong> Your pledge is a commitment; when you give toward it, our finance team records it against your pledge. A confirmation email is on its way.</p>
      </Done>
    );
  }
  return (
    <form noValidate className="grid gap-7" onSubmit={async (e) => { e.preventDefault(); await submit(f, e.currentTarget); }}>
      <Honeypot />
      <p className="m-0 border-l-2 border-blue pl-4 text-body">A pledge is a commitment to give, now or over time. Making a pledge does not charge you anything.</p>
      <AmountPicker value={f.amount} onChange={set("amount")} error={err("amount")} />
      <FrequencyPicker value={f.frequency} onChange={(v) => setF({ ...f, frequency: v })} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Designation catalog={catalog} value={f.designationId} onChange={set("designationId")} />
        <div className="nl-field">
          <label htmlFor="g-intended">How you plan to give <span className="font-normal text-muted">(optional)</span></label>
          <select id="g-intended" value={f.intendedMethod} onChange={(e) => set("intendedMethod")(e.target.value)} className="nl-input">
            <option value="">Not sure yet</option>{methodOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <Input label="Full name" name="p-name" required value={f.name} onChange={set("name")} error={err("name")} autoComplete="name" maxLength={120} />
        <Input label="Email" name="p-email" type="email" required value={f.email} onChange={set("email")} error={err("email")} autoComplete="email" maxLength={254} />
        <Input label="Phone" name="p-phone" type="tel" value={f.phone} onChange={set("phone")} error={err("phone")} autoComplete="tel" maxLength={40} />
        <Input label={f.frequency === "one_time" ? "I expect to give by" : "Pledge period ends"} name="p-date" type="date" value={f.expectedBy} onChange={set("expectedBy")} error={err("expectedBy")} />
      </div>
      <Input label="Message" name="p-msg" type="textarea" value={f.message} onChange={set("message")} error={err("message")} maxLength={2000} />
      {state.status === "error" && <p role="alert" className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.result?.message}</p>}
      <button type="submit" disabled={state.status === "sending"} className="nl-btn nl-btn--lg w-full sm:w-fit"><span>{state.status === "sending" ? "Saving…" : "Make my pledge"}</span><ArrowRight className="h-4 w-4" aria-hidden /></button>
    </form>
  );
}

/* ------------------------------------------------------------------ 03 Cash drop, 04 other ways */
function CashDrop({ catalog }: { catalog: GivingCatalog }) {
  const m = catalog.methods.find((x) => x.kind === "cash_drop");
  const [notify, setNotify] = useState(false);
  if (!m) return <Empty icon={Banknote} title="Cash Drop details are coming soon." text="Instructions for giving cash at church will be published here once they are confirmed." cta={{ label: "Contact us", href: "/contact?topic=giving" }} />;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-5">
        <MethodDetails m={m} />
        <p className="m-0 text-sm text-muted">Cash gifts are counted and confirmed by our finance team after they are collected.</p>
        {!notify && <button type="button" onClick={() => setNotify(true)} className="nl-btn nl-btn--ink-ghost w-fit"><span>Let us know you gave (optional)</span></button>}
      </div>
      <div>
        {m.image && <div className="nl-zoom relative mb-6 aspect-[4/3] bg-paper"><Image src={m.image.url} alt={m.image.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" /></div>}
        {notify && <ConfirmForm method={m} catalog={catalog} />}
      </div>
    </div>
  );
}

function OtherWays({ catalog }: { catalog: GivingCatalog }) {
  const methods = catalog.methods.filter((m) => !["cash_drop", "online_link"].includes(m.kind));
  const [open, setOpen] = useState<string | null>(null);
  if (!methods.length) return <Empty icon={Landmark} title="Other ways to give are coming soon." text="Zelle, Cash App or bank transfer details will be published here once the church approves them." cta={{ label: "Contact us", href: "/contact?topic=giving" }} />;
  return (
    <ol className="border-t border-line">
      {methods.map((m, i) => {
        const Icon = ICON[m.kind] ?? HandCoins;
        return (
          <li key={m.id} className="border-b border-line">
            <div className="nl-hoverbox grid gap-5 px-2 py-7 md:grid-cols-[3rem_1fr]">
              <span className="nl-index nl-num pt-1 text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
              <div className="grid gap-4">
                <h3 className="nl-hb-lift flex items-center gap-3 text-xl font-medium tracking-tight text-ink"><Icon className="h-5 w-5 text-blue-deep" aria-hidden />{m.label}</h3>
                <MethodDetails m={m} />
                {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="nl-btn w-fit"><span>Open {m.label}</span><ArrowUpRight className="h-4 w-4" aria-hidden /></a>}
                {CONFIRM_KIND[m.kind] && (open === m.id
                  ? <div className="border-t border-line pt-5"><ConfirmForm method={m} catalog={catalog} /></div>
                  : <button type="button" onClick={() => setOpen(m.id)} className="nl-textlink w-fit">I&apos;ve sent a gift with {m.label}<ArrowRight className="h-4 w-4" aria-hidden /></button>)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Empty({ icon: Icon, title, text, cta }: { icon: React.ElementType; title: string; text: string; cta: { label: string; href: string } }) {
  return (
    <div className="grid justify-items-start gap-3 border border-dashed border-line p-[clamp(1.5rem,4vw,2.5rem)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-mist text-blue-deep"><Icon className="h-5 w-5" aria-hidden /></span>
      <h3 className="nl-h3">{title}</h3>
      <p className="m-0 max-w-xl text-body">{text}</p>
      <Link href={cta.href} className="nl-btn mt-2"><span>{cta.label}</span></Link>
    </div>
  );
}

/* ------------------------------------------------------------------ the experience */
const OPTIONS = [
  { id: "give", n: "01", title: "Give Now", text: "Ready to give today", icon: HandCoins },
  { id: "pledge", n: "02", title: "Make a Pledge", text: "Commit to give later or over time", icon: CalendarHeart },
  { id: "cash", n: "03", title: "Give by Cash Drop", text: "Give cash in person at church", icon: Banknote },
  { id: "other", n: "04", title: "Other Ways to Give", text: "Zelle, Cash App, bank transfer", icon: Landmark },
] as const;
type OptionId = (typeof OPTIONS)[number]["id"];

export function GivingExperience({ catalog }: { catalog: GivingCatalog }) {
  const [active, setActive] = useState<OptionId>("give");
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (OPTIONS.some((o) => o.id === hash)) setTimeout(() => setActive(hash as OptionId), 0);
  }, []);
  const choose = (id: OptionId) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    if (window.innerWidth < 1024) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 50);
  };
  const current = OPTIONS.find((o) => o.id === active)!;

  const quick = catalog.methods.filter((m) => m.kind === "zelle" || m.kind === "cashapp");
  return (
    <div className="grid gap-10">
      {quick.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quick.map((m) => (
            <div key={m.id} className="nl-hoverbox flex items-center gap-4 border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue text-blue-ink"><Smartphone className="h-5 w-5" aria-hidden /></span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Give by {m.label}</span>
                <span className="nl-num truncate text-xl font-medium text-white">{m.handle ?? "Number coming soon"}</span>
              </span>
              {m.handle && m.kind === "cashapp" ? (
                <a href={cashAppUrl(m.handle)} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue hover:text-white">
                  Open<ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : m.handle ? <span className="ml-auto [&_button]:!text-blue"><CopyText text={m.handle} /></span> : null}
            </div>
          ))}
          <button type="button" onClick={() => choose("pledge")} className="nl-hoverbox flex items-center gap-4 border border-white/20 bg-white/10 p-5 text-left backdrop-blur-md transition-colors hover:bg-white/20">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-deep"><CalendarHeart className="h-5 w-5" aria-hidden /></span>
            <span className="grid gap-0.5"><span className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Commit to give</span><span className="text-xl font-medium text-white">Make a pledge</span></span>
            <ArrowRight className="ml-auto h-5 w-5 text-blue" aria-hidden />
          </button>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div role="tablist" aria-label="Ways to give" aria-orientation="vertical" className="grid grid-cols-2 gap-2 self-start lg:col-span-4 lg:grid-cols-1">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const on = o.id === active;
          return (
            <button key={o.id} role="tab" id={`tab-${o.id}`} aria-selected={on} aria-controls="giving-panel" onClick={() => choose(o.id)}
              className={`nl-hoverbox grid gap-3 border p-5 text-left backdrop-blur-md transition-colors lg:grid-cols-[2.5rem_1fr] lg:items-center lg:p-6 ${on ? "border-white bg-white text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.5)]" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}>
              <span className={`nl-index nl-num ${on ? "!text-blue-deep" : "!text-blue"}`}>{o.n}</span>
              <span className="grid gap-1">
                <span className={`flex items-center gap-2 text-lg font-medium tracking-tight ${on ? "text-ink" : "text-white"}`}><Icon className="h-4 w-4" aria-hidden />{o.title}</span>
                <span className={`text-xs ${on ? "text-muted" : "text-white/70"}`}>{o.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div ref={panelRef} id="giving-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="scroll-mt-28 bg-white p-[clamp(1.25rem,3.5vw,2.75rem)] text-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] lg:col-span-8">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: reduce ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <p className="nl-label mb-4">{current.n} · {current.title}</p>
            {active === "give" && <GiveNow catalog={catalog} />}
            {active === "pledge" && <Pledge catalog={catalog} />}
            {active === "cash" && <CashDrop catalog={catalog} />}
            {active === "other" && <OtherWays catalog={catalog} />}
          </motion.div>
        </AnimatePresence>
        <p className="mt-10 flex items-start gap-2 text-xs text-muted"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />This website never asks for card numbers or bank details. Pledges and payment confirmations are recorded for our finance team; gifts are confirmed only once received.</p>
      </div>
      </div>
    </div>
  );
}
