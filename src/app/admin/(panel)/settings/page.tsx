import { requireCapability } from "@/lib/auth/staff";
import { getSettings } from "@/lib/content";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCapability("content");
  const settings = await getSettings();
  return (
    <>
      <PageTitle title="Site settings" description="Church name, address, service times, public contact details and social links. These appear across the whole website." />
      <SettingsForm s={settings} />
    </>
  );
}
