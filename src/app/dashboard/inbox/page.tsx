import { requireAdminPage } from "@/lib/auth/page-access";
import { listInbox } from "@/lib/contact/inbox";
import { InboxManager } from "@/components/admin/inbox-manager";
export default async function InboxPage() { await requireAdminPage(); let inbox; try { inbox = await listInbox(); } catch { return <><h1 className="text-3xl font-semibold">Inbox unavailable</h1><p role="alert" className="mt-5 text-muted">Messages could not be loaded. Check database connectivity and reload.</p></>; } return <><h1 className="mb-8 text-3xl font-semibold">Messages</h1><InboxManager initial={inbox} /></>; }
