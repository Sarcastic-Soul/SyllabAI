import { SignIn } from "@clerk/nextjs";
import AuthShell, { authAppearance } from "@/components/landing/AuthShell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Pick up where you left off."
      intro="Your courses, quiz scores and the flashcards due today are waiting."
      points={[
        "Chapters you finished stay marked as done",
        "Flashcards come back on the day they are due",
        "The study buddy still has your uploaded notes",
      ]}
      switchText="No account yet?"
      switchLabel="Sign up"
      switchHref="/sign-up"
    >
      <SignIn
        appearance={authAppearance}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
