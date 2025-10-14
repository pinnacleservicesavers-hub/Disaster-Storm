import { describe, it, expect } from "vitest";
import { getLegendUrl } from "../src/ddTiles";

describe("getLegendUrl", () => {
  it("returns unsigned legend path with query params", async () => {
    const result = await getLegendUrl("http://localhost:3001", {
      scheme: "traffic",
      width: 256,
      height: 48,
      bg: "solid",
      fmt: "png"
    }, false);

    expect(result).toContain("/api/legend.png");
    expect(result).toContain("scheme=traffic");
    expect(result).toContain("width=256");
    expect(result).toContain("height=48");
  });

  it("uses default values when opts not provided", async () => {
    const result = await getLegendUrl("http://localhost:3001", {}, false);

    expect(result).toContain("/api/legend.png");
    expect(result).toContain("scheme=traffic");
    expect(result).toContain("width=256");
  });

  it("handles different baseUrl formats", async () => {
    const result = await getLegendUrl("https://disaster-direct.repl.co", {
      scheme: "viridis",
      fmt: "svg"
    }, false);

    expect(result).toContain("/api/legend.svg");
    expect(result).toContain("scheme=viridis");
  });

  it("supports transparent background option", async () => {
    const result = await getLegendUrl("http://localhost:3001", {
      bg: "transparent"
    }, false);

    expect(result).toContain("bg=transparent");
  });
});
