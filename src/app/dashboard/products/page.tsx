import {requireAdminPage} from "@/lib/auth/page-access";
import {listAdminProducts} from "@/lib/products/store";
import {listAdminMedia} from "@/lib/media/list";
import {cloudinaryConfigured} from "@/lib/media/cloudinary";
import {ProductsManager} from "@/components/products/products-manager";
export default async function Page(){await requireAdminPage();const [initial,initialMedia]=await Promise.all([listAdminProducts(),listAdminMedia()]);return <><h1 className="mb-8 text-3xl font-semibold">Products</h1><ProductsManager initial={initial} initialMedia={initialMedia} configured={cloudinaryConfigured()}/></>;}
