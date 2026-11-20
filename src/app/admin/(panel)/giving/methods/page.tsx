import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, inputCls } from "@/components/admin/ui";
import { Check, F, Pill } from "@/components/admin/finance-fields";
import { ActionButton, ActionForm, Disclosure } from "@/components/admin/finance-ui";
import { MediaPicker } from "@/components/admin/media-picker";
import { deleteCatalogRow, savePaymentMethod } from "@/lib/admin/finance-actions";
import { loadMediaLibrary } from "@/lib/admin/loaders";
import { KIND_LABEL, PAYMENT_KINDS } from "@/lib/admin/finance-constants";
import type { Media } from "@/lib/content/types";

interface Method {
  id: string; kind: string; label: string; description: string | null; instructions: string | null; handle: string | null; url: string | null;
  location: string | null; reference_info: string | null; image_id: string | null; supports_recurring: boolean; is_active: boolean; sort_order: number;
}

export default async function PaymentMethods() {
  const supabase = await createSupabaseServerClient();
  const [{ data }, media] = await Promise.all([supabase.from("payment_methods").select("*").order("sort_order"), loadMediaLibrary()]);
  const methods = (data ?? []) as Method[];
  return (
    <>
      <PageTitle title="Payment methods" description="What the Giving page offers. A method appears publicly only when it is active and has the church's approved details. Never enter full bank account, routing or card numbers here." />
      <div className="mb-8 grid gap-3">
        {methods.map((m) => (
          <Disclosure key={m.id} summary={<><span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{KIND_LABEL[m.kind]}</span><span className="font-semibold">{m.label}</span><Pill status={m.is_active ? "active" : "hidden"} label={m.is_active ? "Shown" : "Hidden"} /></>}>
            <ActionForm action={savePaymentMethod.bind(null, m.id)}><MethodFields m={m} media={media} /></ActionForm>
            <div className="mt-4 border-t border-line pt-4"><ActionButton run={deleteCatalogRow.bind(null, "payment_methods", m.id)} label="Delete method" className="text-sm text-red-700 hover:underline" confirmText={`Delete “${m.label}”? Past submissions keep their record.`} /></div>
          </Disclosure>
        ))}
      </div>
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Add a payment method</h2>
        <ActionForm action={savePaymentMethod.bind(null, null)} submitLabel="Add method" reset><MethodFields media={media} /></ActionForm>
      </Card>
    </>
  );
}

function MethodFields({ m, media }: { m?: Method; media: Media[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <F label="Type"><select name="kind" defaultValue={m?.kind ?? "zelle"} className={inputCls}>{PAYMENT_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</select></F>
      <F label="Label shown to donors"><input name="label" required maxLength={80} defaultValue={m?.label} className={inputCls} /></F>
      <F label="Short description" className="md:col-span-2"><input name="description" maxLength={300} defaultValue={m?.description ?? ""} className={inputCls} /></F>
      <F label="Zelle recipient or $Cashtag" hint="Only what the church publishes, such as a giving email or $Cashtag."><input name="handle" maxLength={120} defaultValue={m?.handle ?? ""} className={inputCls} /></F>
      <F label="Secure link (https)" hint="For online giving or Cash App pay links."><input name="url" type="url" maxLength={500} placeholder="https://" defaultValue={m?.url ?? ""} className={inputCls} /></F>
      <F label="Instructions" className="md:col-span-2" hint="Approved wording. For Cash Drop: how and when to give at church."><textarea name="instructions" rows={4} maxLength={2000} defaultValue={m?.instructions ?? ""} className={inputCls} /></F>
      <F label="Location (Cash Drop)" hint="Where at church, exactly as the church describes it."><input name="location" maxLength={300} defaultValue={m?.location ?? ""} className={inputCls} /></F>
      <F label="Reference or memo instructions"><input name="reference_info" maxLength={300} defaultValue={m?.reference_info ?? ""} className={inputCls} /></F>
      <div className="grid gap-1 text-sm font-medium md:col-span-2">Image (optional, for example a photo of the Cash Drop point)<MediaPicker name="image_id" initialId={m?.image_id ?? null} media={media} /></div>
      <F label="Order"><input name="sort_order" type="number" defaultValue={m?.sort_order ?? 0} className={inputCls} /></F>
      <div className="grid content-end gap-2">
        <Check name="supports_recurring" label="Supports recurring gifts" defaultChecked={m?.supports_recurring} />
        <Check name="is_active" label="Show on the Giving page" defaultChecked={m?.is_active} hint="Only once the details are approved." />
      </div>
    </div>
  );
}
