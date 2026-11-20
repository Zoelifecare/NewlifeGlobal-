"use client";
import { ArrowRight, Lock } from "lucide-react";
import { Field, FormStatus, Honeypot } from "./fields";
import { usePublicForm } from "./use-public-form";

function Submit({ sending, label }: { sending: boolean; label: string }) {
  return (
    <button type="submit" className="nl-btn nl-btn--lg w-full sm:w-auto" disabled={sending} aria-busy={sending}>
      <span>{sending ? "Sending…" : label}</span>
      <ArrowRight className="h-4 w-4" aria-hidden />
    </button>
  );
}

export function PrayerForm() {
  const { state, onSubmit, err } = usePublicForm("prayer");
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <Honeypot />
      <Field name="request" label="Your prayer request" textarea required error={err("request")} maxLength={4000} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Name" error={err("name")} autoComplete="name" maxLength={120} />
        <Field name="email" label="Email" type="email" error={err("email")} autoComplete="email" maxLength={254} />
      </div>
      <label className="flex items-start gap-3 text-[0.95rem] text-ink">
        <input type="checkbox" name="mayContact" className="mt-1 h-5 w-5 accent-[var(--nl-blue-deep)]" />
        <span>Yes, a pastor or member of the prayer team may contact me about this request.</span>
      </label>
      <p className="flex items-start gap-2 text-sm text-muted">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Prayer requests are confidential. They are never published and are seen only by authorised pastoral staff.
      </p>
      <FormStatus status={state.status} result={state.result} />
      <div><Submit sending={state.status === "sending"} label="Send prayer request" /></div>
    </form>
  );
}

export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const { state, onSubmit, err } = usePublicForm("contact");
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <Honeypot />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Name" required error={err("name")} autoComplete="name" maxLength={120} />
        <Field name="email" label="Email" type="email" required error={err("email")} autoComplete="email" maxLength={254} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="phone" label="Phone" type="tel" error={err("phone")} autoComplete="tel" maxLength={40} />
        <Field name="subject" label="Subject" error={err("subject")} defaultValue={defaultSubject} maxLength={200} />
      </div>
      <Field name="message" label="Message" textarea required error={err("message")} maxLength={4000} />
      <FormStatus status={state.status} result={state.result} />
      <div><Submit sending={state.status === "sending"} label="Send message" /></div>
    </form>
  );
}

export function VisitForm() {
  const { state, onSubmit, err } = usePublicForm("visit");
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <Honeypot />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Name" required error={err("name")} autoComplete="name" maxLength={120} />
        <Field name="email" label="Email" type="email" required error={err("email")} autoComplete="email" maxLength={254} />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field name="visitDate" label="Planned Sunday" type="date" error={err("visitDate")} />
        <Field name="partySize" label="How many people?" type="number" min={1} max={50} error={err("partySize")} />
        <Field name="phone" label="Phone" type="tel" error={err("phone")} autoComplete="tel" maxLength={40} />
      </div>
      <Field name="message" label="Anything we should know?" textarea error={err("message")} hint="Children's ages, accessibility needs, questions…" maxLength={4000} />
      <FormStatus status={state.status} result={state.result} />
      <div><Submit sending={state.status === "sending"} label="Let us know you're coming" /></div>
    </form>
  );
}
