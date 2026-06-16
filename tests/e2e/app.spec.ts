import { expect, test, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";

async function expectCanvasToRenderPixels(canvas: Locator) {
  const png = PNG.sync.read(await canvas.screenshot());
  let nonBackgroundPixels = 0;

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index];
    const green = png.data[index + 1];
    const blue = png.data[index + 2];

    if (Math.abs(red - 248) > 8 || Math.abs(green - 250) > 8 || Math.abs(blue - 252) > 8) {
      nonBackgroundPixels += 1;
    }
  }

  expect(nonBackgroundPixels).toBeGreaterThan(200);
}

async function openTemplateTab(page: Page) {
  await page.getByRole("tab", { name: "Template" }).click();
}

async function openEditTab(page: Page) {
  await page.getByRole("tab", { name: "Edit" }).click();
}

test("loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.getByText("VaseFold", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Edit" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: "Template" })).toBeVisible();
  await expect(page.getByText("3D construction")).toBeVisible();
  await expect(page.locator("[data-testid='construction-preview-3d'] canvas")).toBeVisible();
  await expect(page.getByLabel("Samples")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("renders the 3D construction canvas on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const canvas = page.locator("[data-testid='construction-preview-3d'] canvas");
    await expect(canvas).toBeVisible();
    await expectCanvasToRenderPixels(canvas);
  }
});

test("toggles the 3D preview between smooth and assembled flat panels", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("[data-testid='construction-preview-3d'] canvas");
  await expect(canvas).toBeVisible();
  await page.getByTestId("construction-mode-flat").click();
  await expect(page.getByRole("button", { name: "Flat panels" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expectCanvasToRenderPixels(canvas);
});

test("updates template when the section count changes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("section-count").fill("12");
  await openTemplateTab(page);

  const preview = page.getByTestId("template-preview");
  await expect(preview).toHaveAttribute("data-panel-count", "12");
});

test("updates template when the panel approximation changes", async ({ page }) => {
  await page.goto("/");
  await openTemplateTab(page);
  const firstPath = page.locator("[data-testid='template-preview'] > path").first();
  const before = await firstPath.getAttribute("d");
  await openEditTab(page);
  const approximationSelect = page.getByLabel("Panel approximation");

  await expect(approximationSelect).toHaveValue("circumference");
  await approximationSelect.selectOption("circumscribed");

  await expect(approximationSelect).toHaveValue("circumscribed");
  await openTemplateTab(page);
  await expect(firstPath).not.toHaveAttribute("d", before ?? "");
});

test("updates template when the revolve angle changes", async ({ page }) => {
  await page.goto("/");
  await openTemplateTab(page);
  const firstPath = page.locator("[data-testid='template-preview'] > path").first();
  const before = await firstPath.getAttribute("d");
  await openEditTab(page);

  await page.getByTestId("revolve-degrees").fill("180");
  await expect(page.getByText("180°", { exact: true })).toBeVisible();

  await openTemplateTab(page);
  await expect(firstPath).not.toHaveAttribute("d", before ?? "");
});

test("switches units and uses height as the only object dimension", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Vase height in mm")).toHaveValue("160");
  await expect(page.getByText(/Max diameter derives from the profile:/)).toBeVisible();
  await expect(page.getByText("Grid: 1 cm")).toBeVisible();
  await expect(page.getByTestId("profile-grid")).toHaveAttribute("data-grid-unit", "mm");
  await expect(page.getByTestId("profile-grid")).toHaveAttribute("data-grid-size", "10.000");
  await openTemplateTab(page);
  await expect(page.getByTestId("template-grid")).toHaveAttribute("data-grid-unit", "mm");
  await expect(page.getByTestId("template-grid")).toHaveAttribute("data-grid-size", "10.000");
  const templatePath = page.locator("[data-testid='template-preview'] > path").first();
  const metricTemplateBox = await templatePath.boundingBox();
  expect(metricTemplateBox).not.toBeNull();

  await openEditTab(page);
  await page.getByRole("button", { name: "Imperial" }).click();
  await expect(page.getByLabel("Vase height in in")).toHaveValue("6.299");
  await expect(page.getByText("Grid: 1/2 in")).toBeVisible();
  await expect(page.getByTestId("profile-grid")).toHaveAttribute("data-grid-unit", "in");
  await expect(page.getByTestId("profile-grid")).toHaveAttribute("data-grid-size", /^12\.70[0-9]$/);
  await openTemplateTab(page);
  await expect(page.getByTestId("template-grid")).toHaveAttribute("data-grid-unit", "in");
  await expect(page.getByTestId("template-grid")).toHaveAttribute("data-grid-size", "0.500");
  const imperialTemplateBox = await templatePath.boundingBox();
  expect(imperialTemplateBox).not.toBeNull();
  expect(imperialTemplateBox!.height).toBeGreaterThan(metricTemplateBox!.height * 0.98);
  expect(imperialTemplateBox!.height).toBeLessThan(metricTemplateBox!.height * 1.02);

  await openEditTab(page);
  await page.getByTestId("object-height").fill("10");
  await expect(page.getByLabel("Vase height in in")).toHaveValue("10");
});

test("dragging a profile handle updates the template path", async ({ page }) => {
  await page.goto("/");
  await openTemplateTab(page);
  const firstPath = page.locator("[data-testid='template-preview'] > path").first();
  const before = await firstPath.getAttribute("d");
  await openEditTab(page);
  const handle = page.getByTestId("handle-p3");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 24, box!.y + box!.height / 2 + 18);
  await page.mouse.up();

  await openTemplateTab(page);
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

test("top profile handle only moves horizontally", async ({ page }) => {
  await page.goto("/");
  const handle = page.getByTestId("handle-p1");
  const initialY = await handle.getAttribute("cy");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 - 60);
  await page.mouse.up();

  await expect(handle).toHaveAttribute("cy", initialY ?? "");
  await expect(handle).not.toHaveAttribute("cx", "0");
});

test("exports an SVG download", async ({ page }) => {
  await page.goto("/");
  await openTemplateTab(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-svg").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("flattened-template.svg");
});
