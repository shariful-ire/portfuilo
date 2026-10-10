import "server-only";
import { revalidatePath } from "next/cache";
export function invalidateHomeContent() { revalidatePath("/"); for (const path of ["sections", "skills", "timeline"]) revalidatePath(`/dashboard/${path}`); }
