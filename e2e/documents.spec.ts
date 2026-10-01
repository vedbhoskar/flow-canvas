import { expect, test } from "@playwright/test";

const imported = {
  schemaVersion: 1,
  id: "imported",
  name: "Imported example",
  nodes: [],
  edges: [],
  scenarios: [],
};
const file = (content: string) => ({
  name: "project.json",
  mimeType: "application/json",
  buffer: Buffer.from(content),
});

test("autosaves a document and restores it after reload", async ({ page }) => {
  await page.goto("/studio?blank=1");
  await page.getByRole("button", { name: /Process Basics/ }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByLabel("Project files").click();
  await expect(page.getByText("Local save: saved")).toBeVisible();
  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
});

test("invalid import preserves work and project replacement requires confirmation", async ({
  page,
}) => {
  await page.goto("/studio?blank=1");
  await page.getByRole("button", { name: /Process Basics/ }).click();
  await page.getByLabel("Choose project JSON").setInputFiles(file("{broken"));
  await expect(page.getByText("Project file is not valid JSON")).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByLabel("Choose project JSON")
    .setInputFiles(file(JSON.stringify(imported)));
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Choose project JSON")
    .setInputFiles(file(JSON.stringify(imported)));
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Imported example",
  );
});

test("exports a project JSON download", async ({ page }) => {
  await page.goto("/studio?blank=1");
  await page.getByLabel("Project files").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("untitled-project.json");
});

test("new project can be cancelled before replacing a populated canvas", async ({
  page,
}) => {
  await page.goto("/studio?blank=1");
  await page.getByRole("button", { name: /Process Basics/ }).click();
  await page.getByLabel("Project files").click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
});
