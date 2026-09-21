import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getCategoryRules } from "@/lib/models/CategoryRule";
import { getPockets } from "@/lib/models/Pocket";
import { RulesPageContent } from "./RulesPageContent";

export default async function RulesPage() {
  const [rules, pockets] = await Promise.all([
    getCategoryRules(),
    getPockets(),
  ]);

  return (
    <PageWrapper title="Category rules">
      <RulesPageContent rulesResponse={rules} pocketsResponse={pockets} />
    </PageWrapper>
  );
}
