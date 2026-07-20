'use client'

import { useState } from "react";
import Nav from "@/components/Nav";
import PublicHome from "@/components/PublicHome";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import PartnerDashboard from "@/components/PartnerDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// Map of completed steps → next onboarding route
const ONBOARDING_ROUTES: Record<number, string> = {
  0: "/partner/onboarding/vehicle",
  1: "/partner/onboarding/documents",
  2: "/partner/onboarding/bank",
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"login" | "signup">("login");

  const userData = useSelector((state: RootState) => state.user.userData);
  const router = useRouter();

  const openLogin = () => { setAuthStep("login"); setAuthOpen(true); };
  const openSignup = () => { setAuthStep("signup"); setAuthOpen(true); };

  // Redirect mid-onboarding users to their next step
  useEffect(() => {
    if (!userData) return;
    if (userData.role === "admin") return;

    const steps = userData.partnerOnboardingSteps ?? 0;

    // If they have started but not finished all 3 steps, send them to the next step
    if (steps > 0 && steps < 3) {
      const nextRoute = ONBOARDING_ROUTES[steps];
      if (nextRoute) router.push(nextRoute);
    }
  }, [userData]);

  // Admin — full screen, no Nav/Footer
  if (userData?.role === "admin") {
    return <AdminDashboard />;
  }

  const renderContent = () => {
    if (!userData) return <PublicHome onAuthRequired={openLogin} />;

    const steps = userData.partnerOnboardingSteps ?? 0;

    // Completed all 3 steps → show onboarding dashboard (pending admin review)
    if (steps >= 3) {
      return <PartnerDashboard />;
    }

    // Mid-onboarding (steps 1–2) → useEffect above handles redirect, show nothing while redirecting
    if (steps > 0) return null;

    // Regular user who hasn't started
    return <PublicHome onAuthRequired={openLogin} />;
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <Nav onLoginClick={openLogin} onSignupClick={openSignup} />
      {renderContent()}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialStep={authStep} />
      <Footer />
    </div>
  );
}
