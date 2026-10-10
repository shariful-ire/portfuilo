import "server-only";
import { revalidatePath } from "next/cache";
export function invalidatePosts() { revalidatePath("/"); revalidatePath("/posts"); revalidatePath("/posts/[slug]", "page"); revalidatePath("/dashboard/posts"); }
