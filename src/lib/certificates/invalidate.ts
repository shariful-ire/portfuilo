import "server-only";
import { revalidatePath } from "next/cache";
export function invalidateCertificates() { revalidatePath("/"); revalidatePath("/certificates"); revalidatePath("/dashboard/certificates"); }
