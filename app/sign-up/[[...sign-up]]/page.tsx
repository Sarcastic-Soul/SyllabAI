import { SignUp } from "@clerk/nextjs";
import AuthShell, { authAppearance } from "@/components/landing/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Make your first course."
      intro="Sign up, then type a topic or upload your notes. The free plan holds 2 courses at a time."
      points={[
        "A chapter outline from a topic or a file",
        "Lessons, three-question quizzes and flashcards per chapter",
        "A study buddy that answers from what you uploaded",
      ]}
      switchText="Already have an account?"
      switchLabel="Sign in"
      switchHref="/sign-in"
    >
      <SignUp
        appearance={authAppearance}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}
