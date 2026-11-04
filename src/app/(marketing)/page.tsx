import * as React from "react";
import { getOwnerSession } from "@/features/auth/server";
import {
  HeroSection,
  TickerStrip,
  ProblemsSection,
  FeaturesSection,
  ValueCalculator,
  FaqSection,
} from "@/features/marketing";

export default async function MarketingHomePage() {
  const user = await getOwnerSession();
  const isLoggedIn = !!user;

  return (
    <>
      <HeroSection isLoggedIn={isLoggedIn} />
      <TickerStrip />
      <ProblemsSection />
      <FeaturesSection />
      <ValueCalculator isLoggedIn={isLoggedIn} />
      <FaqSection />
    </>
  );
}
