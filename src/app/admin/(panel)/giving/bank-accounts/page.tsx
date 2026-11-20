import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, inputCls } from "@/components/admin/ui";
import { Check, F, Pill } from "@/components/admin/finance-fields";
import { ActionButton, ActionForm, Disclosure } from "@/components/admin/finance-ui";
import { deleteCatalogRow, saveBankAccount } from "@/lib/admin/finance-actions";

interface B { id: string; nickname: string; bank_name: string | null; account_holder: string | null; last4: string | null; purpose: string | null; notes: string | null; is_active: boolean }

/** Internal reference list for finance. Never public, never emailed, and only the last 4 digits are stored. */
export default async function BankAccounts() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("bank_accounts").select("*").order("created_at");
  const rows = (data ?? []) as B[];
  return (
    <>
      <PageTitle title="Bank accounts" description="Internal reference for finance only (which account receives what). Never shown on the website or in emails. Store only the last 4 digits: never a full account or routing number." />
      <div className="mb-8 grid gap-3">
        {rows.length === 0 && <p className="text-sm text-muted">No accounts recorded.</p>}
        {rows.map((b) => (
          <Disclosure key={b.id} summary={<><span className="font-semibold">{b.nickname}</span><span className="text-sm text-muted">{[b.bank_name, b.last4 ? `•••• ${b.last4}` : null].filter(Boolean).join(" · ")}</span><Pill status={b.is_active ? "active" : "hidden"} label={b.is_active ? "In use" : "Inactive"} /></>}>
            <ActionForm action={saveBankAccount.bind(null, b.id)}><Fields b={b} /></ActionForm>
            <div className="mt-4 border-t border-line pt-4"><ActionButton run={deleteCatalogRow.bind(null, "bank_accounts", b.id)} label="Delete" className="text-sm text-red-700 hover:underline" confirmText={`Delete “${b.nickname}”?`} /></div>
          </Disclosure>
        ))}
      </div>
      <Card className="max-w-3xl p-6">
        <h2 className="mb-4 font-semibold">Add an account reference</h2>
        <ActionForm action={saveBankAccount.bind(null, null)} submitLabel="Add" reset><Fields /></ActionForm>
      </Card>
    </>
  );
}

function Fields({ b }: { b?: B }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <F label="Nickname"><input name="nickname" required maxLength={80} defaultValue={b?.nickname} placeholder="Operating account" className={inputCls} /></F>
      <F label="Bank"><input name="bank_name" maxLength={120} defaultValue={b?.bank_name ?? ""} className={inputCls} /></F>
      <F label="Account holder"><input name="account_holder" maxLength={120} defaultValue={b?.account_holder ?? ""} className={inputCls} /></F>
      <F label="Last 4 digits only"><input name="last4" inputMode="numeric" pattern="\d{4}" maxLength={4} defaultValue={b?.last4 ?? ""} className={inputCls} /></F>
      <F label="Purpose" className="md:col-span-2"><input name="purpose" maxLength={200} defaultValue={b?.purpose ?? ""} placeholder="Receives Zelle and bank transfer gifts" className={inputCls} /></F>
      <F label="Notes" className="md:col-span-2"><textarea name="notes" rows={2} maxLength={1000} defaultValue={b?.notes ?? ""} className={inputCls} /></F>
      <Check name="is_active" label="In use" defaultChecked={b?.is_active ?? true} />
    </div>
  );
}
