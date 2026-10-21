import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ParticleNetworkProvider } from "./particles/particle-network-provider";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-full flex-col bg-background text-foreground">
      <ParticleNetworkProvider>
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </ParticleNetworkProvider>
    </div>
  );
}
