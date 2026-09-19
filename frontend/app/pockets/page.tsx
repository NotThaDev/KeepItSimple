import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getRouteLabel } from "@/components/sidebar/RouteDefinition";
import { getPockets } from "@/lib/models/Pocket";
import { PocketPageContent } from "./PocketPageContent";

export const metadata = {
  title: getRouteLabel("/pockets"),
};

export default async function PocketsPage() {
  const pockets = await getPockets();

  return (
    <PageWrapper title="Pockets">
      <PocketPageContent pocketDataResponse={pockets} />
    </PageWrapper>
  );
}
