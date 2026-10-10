import "server-only";
import { revalidatePath } from "next/cache";
export function invalidateProjects() { revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/projects/[slug]", "page"); revalidatePath("/dashboard/projects"); }
