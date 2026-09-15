import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getPockets } from "@/lib/models/Pocket";
import { ImportTesterContent } from "./ImportTesterContent";

export default async function ImportTesterPage() {
  const pockets = await getPockets();

  return (
    <PageWrapper title="Import tester">
      <ImportTesterContent pockets={pockets.data ?? []} />
    </PageWrapper>
  );
}
