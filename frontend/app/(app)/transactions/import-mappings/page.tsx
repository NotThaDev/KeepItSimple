import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getImportMappings } from "@/lib/models/ImportMapping";
import { ImportMappingsPageContent } from "./ImportMappingsPageContent";

export const metadata: Metadata = { title: "Import mappings" };

export default async function ImportMappingsPage() {
  const mappings = await getImportMappings();

  return (
    <PageWrapper title="Import mappings">
      <ImportMappingsPageContent mappingsResponse={mappings} />
    </PageWrapper>
  );
}
