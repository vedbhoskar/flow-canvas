import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });

test("deterministic gallery, editor, paused and presentation views", async ({
  page,
}) => {
  test.skip(
    process.platform !== "darwin",
    "Reference images were reviewed on macOS Chromium",
  );
  await page.goto("/");
  await expect(page).toHaveScreenshot("gallery.png", {
    animations: "disabled",
    caret: "hide",
  });
  await page.goto("/studio?example=resource-redistribution");
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await expect
    .poll(() =>
      page
        .locator(".react-flow__viewport")
        .evaluate(
          (element) =>
            new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
        ),
    )
    .toBeLessThan(0.9);
  await expect(page).toHaveScreenshot("resource-editor.png", {
    animations: "disabled",
    caret: "hide",
  });
  await page.getByRole("button", { name: "Simulate" }).click();
  await page.getByRole("button", { name: "Step" }).click();
  await page.getByRole("button", { name: "Step" }).click();
  await expect(page).toHaveScreenshot("resource-paused.png", {
    animations: "disabled",
    caret: "hide",
  });
  await page.getByRole("button", { name: "Present" }).click();
  await expect
    .poll(
      async () =>
        (await page.locator('.react-flow__node[data-id="pool"]').boundingBox())
          ?.x ?? 0,
    )
    .toBeGreaterThan(200);
  await expect(page).toHaveScreenshot("resource-present.png", {
    animations: "disabled",
    caret: "hide",
  });
});

test("100-node and 200-edge project remains operable without page overflow", async ({
  page,
}) => {
  const nodes = Array.from({ length: 100 }, (_, index) => ({
    id: `node-${index}`,
    moduleType: "basic.process",
    label: `Process ${index}`,
    position: { x: (index % 10) * 240, y: Math.floor(index / 10) * 140 },
    config: { description: "Load smoke" },
  }));
  const edges = Array.from({ length: 200 }, (_, index) => ({
    id: `edge-${index}`,
    sourceNodeId: `node-${index % 100}`,
    sourcePortId: "out",
    targetNodeId: `node-${(index + (index < 100 ? 1 : 2)) % 100}`,
    targetPortId: "in",
  }));
  const project = {
    schemaVersion: 1,
    id: "smoke",
    name: "Scale smoke",
    nodes,
    edges,
    scenarios: [],
  };
  await page.goto("/studio?blank=1");
  await page.getByLabel("Choose project JSON").setInputFiles({
    name: "smoke.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Scale smoke",
  );
  await expect(page.locator(".react-flow__node")).toHaveCount(100);
  await expect(page.locator(".react-flow__edge")).toHaveCount(200);
  await page.getByRole("button", { name: "Fit view" }).click();
  await expect(page.getByRole("main", { name: "Canvas" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
});
