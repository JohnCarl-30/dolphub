import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallbackPanel } from "./content-error-boundary";

describe("ErrorFallbackPanel", () => {
  it("renders a safe accessible page fallback without server details", () => {
    const html = renderToStaticMarkup(
      <ErrorFallbackPanel
        eyebrow="/u"
        title="This student page is temporarily unavailable."
        description="Please try again shortly."
        variant="page"
        showHomeLink
        onRetry={vi.fn()}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("This student page is temporarily unavailable.");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("42P01");
    expect(html).not.toContain("digest");
  });
});
