import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageTitle, inputCls } from "@/components/admin/ui";
import { Check, F, Pill } from "@/components/admin/finance-fields";
import { ActionButton, ActionForm, Disclosure } from "@/components/admin/finance-ui";
import { deleteCatalogRow, saveDesignation } from "@/lib/admin/finance-actions";

interface D { id: string; name: string; description: string | null; is_active: boolean; sort_order: number }

export default async function Designations() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("giving_designations").select("*").order("sort_order");
  const rows = (data ?? []) as D[];
  return (
    <>
      <PageTitle title="Giving designations" description="Funds donors can give toward (for example General giving or a building fund). Only active designations are offered on the Giving page. With none, gifts are recorded as general giving." />
      <div className="mb-8 grid gap-3">
        {rows.map((d) => (
          <Disclosure key={d.id} summary={<><span className="font-semibold">{d.name}</span><Pill status={d.is_active ? "active" : "hidden"} label={d.is_active ? "Offered" : "Hidden"} /></>}>
            <ActionForm action={saveDesignation.bind(null, d.id)}><Fields d={d} /></ActionForm>
            <div className="mt-4 border-t border-line pt-4"><ActionButton run={deleteCatalogRow.bind(null, "giving_designations", d.id)} label="Delete" className="text-sm text-red-700 hover:underline" confirmText={`Delete “${d.name}”? Existing gifts keep their amounts but lose this label.`} /></div>
          </Disclosure>
        ))}
      </div>
      <Card className="max-w-2xl p-6">
        <h2 className="mb-4 font-semibold">Add a designation</h2>
        <ActionForm action={saveDesignation.bind(null, null)} submitLabel="Add" reset><Fields /></ActionForm>
      </Card>
    </>
  );
}

function Fields({ d }: { d?: D }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <F label="Name"><input name="name" required maxLength={80} defaultValue={d?.name} className={inputCls} /></F>
      <F label="Order"><input name="sort_order" type="number" defaultValue={d?.sort_order ?? 0} className={inputCls} /></F>
      <F label="Description" className="md:col-span-2"><input name="description" maxLength={300} defaultValue={d?.description ?? ""} className={inputCls} /></F>
      <Check name="is_active" label="Offer on the Giving page" defaultChecked={d?.is_active ?? true} />
    </div>
  );
}
