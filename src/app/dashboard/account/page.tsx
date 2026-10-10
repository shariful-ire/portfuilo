import { requireAdminPage } from "@/lib/auth/page-access";
import { Card } from "@/components/ui/card";
export default async function Account() {
  const admin = await requireAdminPage();
  return <><h1 className="text-3xl font-semibold">Account</h1><Card className="mt-8"><h2 className="text-lg font-medium">Verified Google account</h2><p className="mt-3 break-all text-muted">{admin.email}</p><p className="mt-5 text-sm leading-7 text-muted">Administrator access is configured on the server and checked for every protected request.</p></Card></>;
}
