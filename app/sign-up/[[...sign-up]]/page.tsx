import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex rounded-4xl border border-black bg-white shadow-xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-white"
            >
              <Image src="/logo.svg" alt="logo" width={46} height={44} />
              <span className="text-2xl font-bold">SyllabAI</span>
            </Link>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Start your AI-powered learning adventure
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Join thousands of learners using voice-based AI tutors to master
              new skills. Learn naturally through conversation.
            </p>

            <div className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/check.svg"
                  alt="check"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
                <span className="text-white">
                  Personalized AI tutors for every subject
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/check.svg"
                  alt="check"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
                <span className="text-white">
                  Learn through natural conversation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Image
                  src="/icons/check.svg"
                  alt="check"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
                <span className="text-white">
                  Track your progress and achievements
                </span>
              </div>
            </div>
          </div>

          <div className="text-white/70 text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-white font-semibold hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={40}
                  height={38}
                />
                <span className="text-2xl font-bold">SyllabAI</span>
              </Link>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">
                Join our community of learners today
              </p>
            </div>

            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full font-[var(--font-bricolage)]",
                  card: "shadow-none border-none p-0 bg-transparent w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton:
                    "border-2 border-gray-800 rounded-xl hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 text-base transition-all duration-200 hover:shadow-md w-full",
                  socialButtonsBlockButtonText: "font-semibold text-base",
                  socialButtonsIconButton: "w-5 h-5",
                  dividerRow: "my-8",
                  dividerText: "text-gray-500 text-sm font-medium",
                  dividerLine: "bg-gray-200",
                  formFieldLabel: "text-gray-700 font-semibold text-sm mb-2",
                  formFieldInput:
                    "border-2 border-gray-800 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary focus:border-primary text-base font-medium bg-white transition-all duration-200 w-full",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-white rounded-xl py-4 px-6 font-bold text-base transition-all duration-200 hover:shadow-lg w-full mt-2",
                  footerAction: "hidden",
                  identityPreviewText: "text-gray-700 font-medium text-sm",
                  identityPreviewEditButton:
                    "text-primary hover:text-primary/80 font-semibold text-sm",
                  formResendCodeLink:
                    "text-primary hover:text-primary/80 font-semibold text-sm underline",
                  otpCodeFieldInput:
                    "border-2 border-gray-800 rounded-xl text-center font-bold text-lg",
                  alternativeMethodsBlockButton:
                    "text-primary hover:text-primary/80 font-semibold text-sm",
                  formFieldSuccessText: "text-green-600 font-medium text-sm",
                  formFieldErrorText: "text-red-600 font-medium text-sm",
                  formFieldWarningText: "text-yellow-600 font-medium text-sm",
                  formFieldHintText: "text-gray-500 font-medium text-xs",
                  formFieldInputShowPasswordButton:
                    "text-gray-600 hover:text-gray-800",
                  modalContent: "font-[var(--font-bricolage)]",
                  modalCloseButton: "text-gray-500 hover:text-gray-700",
                },
                variables: {
                  fontFamily: "var(--font-bricolage)",
                  fontSize: "16px",
                  fontWeight: {
                    normal: "400",
                    medium: "500",
                    semibold: "600",
                    bold: "700",
                  },
                },
              }}
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/dashboard"
            />

            <div className="text-center mt-6 lg:hidden">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
