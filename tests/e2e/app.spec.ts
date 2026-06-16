import { expect, test } from "@playwright/test";

test("loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Flatten Revolved Curve" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("updates template when the section count changes", async ({ page }) => {
  await page.goto("/");
  const preview = page.getByTestId("template-preview");
  await expect(preview).toHaveAttribute("data-panel-count", "7");

  await page.getByTestId("section-count").fill("12");
  await expect(preview).toHaveAttribute("data-panel-count", "12");
});

test("updates template when the revolve angle changes", async ({ page }) => {
  await page.goto("/");
  const firstPath = page.locator("[data-testid='template-preview'] path").first();
  const before = await firstPath.getAttribute("d");

  await page.getByTestId("revolve-degrees").fill("180");

  await expect(firstPath).not.toHaveAttribute("d", before ?? "");
  await expect(page.getByText("180°")).toBeVisible();
});

test("switches units and uses height as the only object dimension", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Vase height in mm")).toHaveValue("160");
  await expect(page.getByText(/Max diameter derives from the profile:/)).toBeVisible();
  const vasePath = page.locator("[data-testid='vase-preview'] path");
  const templatePath = page.locator("[data-testid='template-preview'] path").first();
  const metricBox = await vasePath.boundingBox();
  const metricTemplateBox = await templatePath.boundingBox();
  expect(metricBox).not.toBeNull();
  expect(metricTemplateBox).not.toBeNull();
  await expect(page.getByTestId("vase-center-line")).toHaveAttribute(
    "vector-effect",
    "non-scaling-stroke",
  );

  await page.getByRole("button", { name: "Imperial" }).click();
  await expect(page.getByLabel("Vase height in in")).toHaveValue("6.299");
  const imperialBox = await vasePath.boundingBox();
  const imperialTemplateBox = await templatePath.boundingBox();
  expect(imperialBox).not.toBeNull();
  expect(imperialTemplateBox).not.toBeNull();
  expect(imperialBox!.height).toBeGreaterThan(metricBox!.height * 0.98);
  expect(imperialBox!.height).toBeLessThan(metricBox!.height * 1.02);
  expect(imperialTemplateBox!.height).toBeGreaterThan(metricTemplateBox!.height * 0.98);
  expect(imperialTemplateBox!.height).toBeLessThan(metricTemplateBox!.height * 1.02);

  await page.getByTestId("object-height").fill("10");
  await expect(page.getByLabel("Vase height in in")).toHaveValue("10");
});

test("dragging a profile handle updates the template path", async ({ page }) => {
  await page.goto("/");
  const firstPath = page.locator("[data-testid='template-preview'] path").first();
  const before = await firstPath.getAttribute("d");
  const handle = page.getByTestId("handle-p3");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 24, box!.y + box!.height / 2 + 18);
  await page.mouse.up();

  await expect(firstPath).not.toHaveAttribute("d", before ?? "");
});

test("bottom profile handle only moves horizontally", async ({ page }) => {
  await page.goto("/");
  const handle = page.getByTestId("handle-p4");
  const initialY = await handle.getAttribute("cy");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 - 60);
  await page.mouse.up();

  await expect(handle).toHaveAttribute("cy", initialY ?? "");
});

test("exports an SVG download", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-svg").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("flattened-template.svg");
});
