"use client";

import { useEffect, useState } from "react";
import type { PublicOpportunity } from "@/lib/services/opportunities";
import { focusOpportunity, mockOpportunities, upcomingOpportunities } from "@/lib/mock-home";

export type MockHome = {
  now: Date;
  upcoming: PublicOpportunity[];
  focus: PublicOpportunity | null;
};

/**
 * Mock home content, computed in the browser so relative dates match the visitor's clock.
 * Returns null until mounted. Add `?mock=empty` to the URL to see the empty states, or
 * `?mock=calm` to see the page with nothing closing soon.
 */
export function useMockHome(): MockHome | null {
  const [state, setState] = useState<MockHome | null>(null);

  useEffect(() => {
    const now = new Date();
    const scenario = new URLSearchParams(window.location.search).get("mock");
    let posts = mockOpportunities(now);
    if (scenario === "empty") posts = [];
    if (scenario === "calm") posts = posts.filter((item) => item.closesAt.getTime() - now.getTime() > 4 * 86_400_000);
    // Browser clock and query string only exist after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ now, upcoming: upcomingOpportunities(posts, now), focus: focusOpportunity(posts, now) });
  }, []);

  return state;
}
