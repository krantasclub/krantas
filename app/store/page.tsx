import type { Metadata } from "next";
import StoreSection from "@/components/StoreSection";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Store",
  description: "Krantas merch — restocks monthly.",
  alternates: { canonical: "/store" },
};

export const revalidate = 60;

export default async function StorePage() {
  const products = await getProducts();
  return (
    <div className="pt-16 sm:pt-20">
      <StoreSection initialProducts={products} />
    </div>
  );
}
