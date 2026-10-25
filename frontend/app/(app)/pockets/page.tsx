import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getPockets } from "@/lib/models/Pocket";
import { PocketPageContent } from "./PocketPageContent";

export const metadata: Metadata = { title: "Pockets" };

export default async function PocketsPage() {
  const pockets = await getPockets();

  return (
    <PageWrapper title="Pockets">
      <PocketPageContent pocketDataResponse={pockets} />
    </PageWrapper>
  );
}
