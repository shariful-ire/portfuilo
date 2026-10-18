import {ProductInbox} from "@/components/products/product-inbox";
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;status?:string}>}){return <ProductInbox kind="reviews" params={await searchParams}/>;}
