import { PricingTable } from "@clerk/nextjs";

const Subscription = () => {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
      <header className="max-w-[60ch] space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Plans</h1>
        <p className="leading-relaxed text-muted-foreground">
          The Basic plan lets you generate 2 courses. Pro removes that limit.
        </p>
      </header>

      <div className="mt-8">
        {/* Clerk renders the plan cards and handles checkout */}
        <PricingTable
          appearance={{
            variables: {
              colorPrimary: "#e8471f",
              borderRadius: "0.5rem",
            },
          }}
        />
      </div>
    </main>
  );
};

export default Subscription;
