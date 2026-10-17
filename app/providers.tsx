"use client";

import { MockStoreProvider } from "@/components/mock-store";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <MockStoreProvider>{children}</MockStoreProvider>;
}
