import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "../../src/app/page";

describe("Flow Canvas entry", () => {
  it("links to the studio with the project identity", () => {
    const markup = renderToStaticMarkup(<Home />);
    expect(markup).toContain("Flow Canvas");
    expect(markup).toContain('href="/studio"');
  });
});
