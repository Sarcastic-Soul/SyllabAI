import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionsList";
import CTA from "@/components/CTA";
import {
  getAllCompanions,
  getRecentSessions,
} from "@/lib/actions/companion.actions";
import { syncUserToDatabase } from "@/lib/actions/syncUser";
import { getSubjectColor } from "@/lib/utils";

const Page = async () => {
  await syncUserToDatabase();
  const companions = await getAllCompanions({ limit: 3 });
  const recentSessionsCompanions = await getRecentSessions(10);

  const validCompanions =
    companions?.filter((companion) => companion && companion.id) || [];
  const validRecentSessions =
    recentSessionsCompanions?.filter(
      (companion) => companion && companion.id,
    ) || [];

  return (
    <>
      <main>
        <h1>Popular Companions</h1>

        <section className="home-section">
          {validCompanions.map((companion) => (
            <CompanionCard
              key={companion.id}
              {...companion}
              color={getSubjectColor(companion.subject)}
            />
          ))}
        </section>

        <section className="home-section">
          <CompanionsList
            title="Recently completed sessions"
            companions={validRecentSessions}
            classNames="w-2/3 max-lg:w-full"
          />
          <CTA />
        </section>
      </main>
    </>
  );
};

export default Page;
