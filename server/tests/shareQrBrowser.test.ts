import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { APP_URL } from "../../client/src/lib/brand";

test("invite QR code opens the canonical landing page and downloads as PNG", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 60_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    serviceWorkers: "block",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

  try {
    await page.goto(base);
    await page.addStyleTag({ content: "#replit-dev-banner { display: none !important; pointer-events: none !important; }" });
    await page.getByTestId("button-share").click();

    const qrSection = page.getByTestId("section-share-qr");
    await expect(qrSection).toBeVisible();
    await expect(qrSection).toHaveAttribute("data-qr-url", APP_URL);
    await expect(qrSection).toContainText(APP_URL);

    const canvas = page.getByTestId("canvas-share-qr");
    await expect(canvas).toBeVisible();
    const dialog = page.getByTestId("dialog-share");
    for (const [width, height] of [[320, 568], [360, 740], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      const bounds = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, height: rect.height,
          width: style.width, maxWidth: style.maxWidth, maxHeight: style.maxHeight,
          className: element.className,
        };
      });
      console.log(`Dialog bounds at ${width}x${height}:`, bounds);
      assert.ok(bounds.x >= 7 && bounds.right <= width - 7, `dialog fits horizontally at ${width}px`);
      assert.ok(bounds.y >= 7 && bounds.bottom <= height - 7, `dialog fits vertically at ${height}px`);
      assert.ok(bounds.height <= height - 14, `dialog height is capped at ${height}px`);
      const qrBounds = await canvas.boundingBox();
      assert.ok(qrBounds && qrBounds.width <= 96 && qrBounds.height <= 96, "visible QR scales down on mobile");
    }
    await page.setViewportSize({ width: 390, height: 844 });

    const renderedQr = await canvas.evaluate((element: HTMLCanvasElement) => ({
      width: element.width,
      height: element.height,
      dataUrl: element.toDataURL("image/png"),
    }));
    assert.equal(renderedQr.width, 512);
    assert.equal(renderedQr.height, 512);
    assert.match(renderedQr.dataUrl, /^data:image\/png;base64,/);

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("button-download-qr").click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "ethio-panda-qr-code.png");
    const downloadedPath = await download.path();
    assert.ok(downloadedPath);
    const png = await readFile(downloadedPath);
    assert.ok(png.length > 1000, "download contains a rendered QR image");
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

    console.log("PASS: invitation QR encodes the public Ethio Panda URL and downloads as a valid PNG.");
  } finally {
    await context.close();
    await browser.close();
  }
});
