import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getCategories } from "@/lib/models/Category";
import { CategoriesPageContent } from "./CategoriesPageContent";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <PageWrapper title="Categories">
      <CategoriesPageContent categoriesResponse={categories} />
    </PageWrapper>
  );
}
