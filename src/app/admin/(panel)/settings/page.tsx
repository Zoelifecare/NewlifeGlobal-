import { redirect } from "next/navigation";

/** Site settings now live in Church Identity & Settings. */
export default function SettingsRedirect() {
  redirect("/admin/identity?tab=church");
}
