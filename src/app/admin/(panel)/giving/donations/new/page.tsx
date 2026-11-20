import { Card, PageTitle } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/finance-ui";
import { DonationFields } from "@/components/admin/finance-fields";
import { recordDonation } from "@/lib/admin/finance-actions";
import { loadFinanceOptions } from "@/lib/admin/finance-loaders";

export default async function NewDonation({ searchParams }: { searchParams: Promise<{ pledge?: string; method?: string; source?: string }> }) {
  const [sp, opts] = await Promise.all([searchParams, loadFinanceOptions()]);
  return (
    <>
      <PageTitle title="Record a donation" back={{ href: "/admin/giving/donations", label: "Confirmed donations" }}
        description="Only record money that has actually been received and counted. To confirm a gift a donor told us about, verify it from Pending confirmations instead so the two stay linked." />
      <Card className="max-w-3xl p-6">
        <ActionForm action={recordDonation} submitLabel="Record donation" reset redirectTo={sp.pledge ? `/admin/giving/pledges/${sp.pledge}` : "/admin/giving/donations"}>
          <DonationFields designations={opts.designations} pledges={opts.pledges} defaults={{ pledgeId: sp.pledge, method: sp.method, source: sp.source }} />
        </ActionForm>
      </Card>
    </>
  );
}
