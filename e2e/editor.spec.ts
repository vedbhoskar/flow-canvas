import { expect, test } from "@playwright/test";

test("add, select, duplicate, delete and undo modules", async ({ page }) => {
  await page.goto("/studio");
  const process = page.getByRole("button", { name: /Process Basics/ });
  await process.click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.locator(".react-flow__node").click();
  await expect(
    page.getByRole("button", { name: "Duplicate selection" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Duplicate selection" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.getByRole("button", { name: "Delete selection" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await page.getByRole("button", { name: "Fit view" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
});

test("drag a palette module onto the canvas", async ({ page }) => {
  await page.goto("/studio");
  const canvas = page.getByRole("main", { name: "Canvas" });
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page
    .getByRole("button", { name: /Database Systems/ })
    .dragTo(canvas, { targetPosition: { x: 300, y: 150 } });
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.locator(".react-flow__node")).toContainText("Database");
});

test("connect compatible ports, reject invalid ports, and restore a deleted subgraph", async ({
  page,
}) => {
  await page.goto("/studio");
  const canvas = page.getByRole("main", { name: "Canvas" });
  await page
    .getByRole("button", { name: /Process Basics/ })
    .dragTo(canvas, { targetPosition: { x: 160, y: 170 } });
  await page
    .getByRole("button", { name: /Database Systems/ })
    .dragTo(canvas, { targetPosition: { x: 480, y: 170 } });
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  const first = page.locator(".react-flow__node").first();
  const second = page.locator(".react-flow__node").last();
  await first
    .locator('[data-handleid="in"]')
    .dragTo(second.locator('[data-handleid="in"]'));
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await first
    .locator('[data-handleid="out"]')
    .dragTo(second.locator('[data-handleid="in"]'));
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await first.click();
  await second.click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Delete selection" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});

test("drop coordinates remain correct after zoom and a node drag is one undoable edit", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Zoom in" }).click();
  const canvas = page.getByRole("main", { name: "Canvas" });
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  await page
    .getByRole("button", { name: /Service Systems/ })
    .dragTo(canvas, { targetPosition: { x: 190, y: 130 } });
  const node = page.locator(".react-flow__node");
  await expect(node).toHaveCount(1);
  const before = await node.boundingBox();
  expect(before).not.toBeNull();
  expect(Math.abs(before!.x - (bounds!.x + 190))).toBeLessThan(12);
  expect(Math.abs(before!.y - (bounds!.y + 130))).toBeLessThan(12);
  await page.mouse.move(
    before!.x + before!.width / 2,
    before!.y + before!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 400, bounds!.y + 300, { steps: 12 });
  await page.mouse.up();
  const moved = await node.boundingBox();
  expect(moved!.x).toBeGreaterThan(before!.x + 40);
  await page.getByRole("button", { name: "Undo" }).click();
  const restored = await node.boundingBox();
  expect(Math.abs(restored!.x - before!.x)).toBeLessThan(3);
});

test("inspector saves a property and undo restores it", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: /Process Basics/ }).click();
  await page.locator(".react-flow__node").click();
  const inspector = page.getByRole("complementary", { name: "Inspector" });
  await inspector
    .getByRole("textbox", { name: "Node label" })
    .fill("New process");
  await inspector
    .getByRole("textbox", { name: "Description" })
    .fill("Checks the request");
  await inspector.getByRole("button", { name: "Save properties" }).click();
  await expect(page.locator(".react-flow__node")).toContainText("New process");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".react-flow__node")).toContainText("Process");
  await expect(
    inspector.getByRole("textbox", { name: "Description" }),
  ).toHaveValue("");
});
