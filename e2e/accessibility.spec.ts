import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("keyboard editing ignores text fields and exposes undo/delete", async ({
  page,
}) => {
  await page.goto("/studio?blank=1");
  const search = page.getByRole("searchbox", { name: "Search modules" });
  await search.focus();
  await search.fill("process");
  await search.press("Enter");
  const moduleButton = page.getByRole("button", { name: /Process Basics/ });
  await moduleButton.focus();
  await moduleButton.press("Enter");
  const node = page.locator(".react-flow__node");
  await expect(node).toHaveCount(1);
  await node.click();
  const name = page.getByRole("textbox", { name: "Project name" });
  await name.focus();
  await name.press("Backspace");
  await expect(node).toHaveCount(1);
  await node.click();
  await page.keyboard.press("Delete");
  await expect(node).toHaveCount(0);
  await page.keyboard.press("ControlOrMeta+z");
  await expect(node).toHaveCount(1);
  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(node).toHaveCount(0);
});

test("Escape exits presentation and reduced motion retains status", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/studio?example=resource-redistribution");
  await page.getByRole("button", { name: "Present" }).click();
  await expect(
    page.getByRole("button", { name: "Exit playback" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Exit playback" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Simulate" }).click();
  await page.getByRole("button", { name: "Step" }).click();
  await expect(
    page.locator(".react-flow__node").filter({ hasText: "Resource pool" }),
  ).toContainText("Status: active");
  await page.getByRole("button", { name: "Step" }).click();
  const activeEdge = page
    .locator(".react-flow__edge.animated .react-flow__edge-path")
    .first();
  await expect(activeEdge).toBeVisible();
  expect(
    await activeEdge.evaluate(
      (element) => getComputedStyle(element).animationName,
    ),
  ).toBe("none");
});

test("editor and presentation pass automated axe checks without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/studio?example=api-lifecycle");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  const editor = await new AxeBuilder({ page }).analyze();
  expect(
    editor.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Present" }).click();
  const presentation = await new AxeBuilder({ page }).analyze();
  expect(
    presentation.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});

test("mobile panels stay available without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio?example=api-lifecycle");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Toggle modules" }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search modules" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle inspector" }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toBeVisible();
});

test("mid-width studio gives the graph room and keeps panels one click away", async ({
  page,
}) => {
  await page.setViewportSize({ width: 840, height: 900 });
  await page.goto("/studio?example=api-lifecycle");
  await expect(
    page.getByRole("complementary", { name: "Modules" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toHaveCount(0);
  await expect(page.locator(".react-flow__node")).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Toggle modules" }).click();
  await expect(
    page.getByRole("searchbox", { name: "Search modules" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Toggle modules" }).click();
  await page.getByRole("button", { name: "Toggle inspector" }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toBeVisible();
});
