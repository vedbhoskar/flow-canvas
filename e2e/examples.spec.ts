import { expect, test } from "@playwright/test";

test("gallery opens a scripted example and fresh studio opens the API story", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Start with a story" }),
  ).toBeVisible();
  await expect(page.getByText("Scripted demo", { exact: true })).toHaveCount(3);
  await page.getByRole("link", { name: /Resource redistribution/ }).click();
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Resource redistribution",
  );
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.goto("/studio");
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "API lifecycle",
  );
});

test("saved work wins unless the user confirms replacing it with an example", async ({
  page,
}) => {
  await page.goto("/studio?blank=1");
  const title = page.getByRole("textbox", { name: "Project name" });
  await title.fill("Keep my work");
  await title.press("Enter");
  await expect(title).toHaveValue("Keep my work");
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("flow-canvas:project:v1")),
    )
    .toContain("Keep my work");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goto("/studio?example=agent-research");
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Keep my work",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.goto("/studio?example=agent-research");
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Agent research",
  );
  await expect(page.locator(".react-flow__node")).toHaveCount(5);
});
