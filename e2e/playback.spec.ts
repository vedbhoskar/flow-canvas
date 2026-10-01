import { expect, test } from "@playwright/test";

const project = {
  schemaVersion: 1,
  id: "playback-demo",
  name: "Playback demo",
  nodes: [
    {
      id: "node",
      moduleType: "basic.process",
      label: "Worker",
      position: { x: 200, y: 130 },
      config: { description: "" },
    },
  ],
  edges: [],
  scenarios: [
    {
      id: "run",
      name: "Three-second run",
      durationMs: 3000,
      events: [
        {
          id: "start",
          atMs: 0,
          type: "node.status",
          nodeId: "node",
          status: "active",
        },
        {
          id: "log",
          atMs: 1000,
          type: "log.append",
          message: "Work in progress",
          level: "info",
          nodeId: "node",
        },
        {
          id: "finish",
          atMs: 3000,
          type: "node.status",
          nodeId: "node",
          status: "success",
        },
      ],
    },
  ],
};

test("play, pause, step, restart and presentation keep the document intact", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.getByLabel("Choose project JSON").setInputFiles({
    name: "playback.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await page.getByRole("button", { name: "Simulate" }).click();
  await expect(
    page.getByRole("button", { name: /Process Basics/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.locator('.react-flow__node [aria-label$=", active"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Step" }).click();
  await expect(
    page.getByRole("list").getByText("Work in progress"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Step" }).click();
  await expect(
    page.locator('.react-flow__node [aria-label$=", success"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(
    page.locator('.react-flow__node [aria-label$=", idle"]'),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Present" }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Exit playback" }).click();
  await expect(
    page.getByRole("complementary", { name: "Inspector" }),
  ).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Playback demo",
  );
});
