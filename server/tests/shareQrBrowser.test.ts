import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { APP_NAME, APP_URL } from "../../client/src/lib/brand";

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
    const telegramLink = page.getByRole("link", { name: "加入频道" });
    await expect(telegramLink).toHaveAttribute("href", "https://t.me/ethiopandalanguages");
    await expect(telegramLink).toHaveAttribute("target", "_blank");
    await expect(page.getByText("获取版本说明、帮助和团队答复。")).toBeVisible();
    await expect(page.getByTestId("install-app-floating-button")).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId("install-app-floating-button")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByTestId("install-app-floating-button")).toHaveCount(0);
    await page.getByTestId("button-share").click();

    const qrSection = page.getByTestId("section-share-qr");
    await expect(qrSection).toBeVisible();
    await expect(qrSection).toHaveAttribute("data-qr-url", APP_URL);
    await expect(qrSection).toContainText(APP_URL);

    const canvas = page.getByTestId("canvas-share-qr");
    await expect(canvas).toBeVisible();
    const dialog = page.getByTestId("dialog-share");
    const messagePreview = page.getByTestId("preview-share-message");
    await expect(messagePreview).toContainText(`${APP_NAME} — 更好的对话，开启更紧密的商业联系。`);
    await expect(messagePreview).toContainText("开始88小时免费试学");
    await expect(messagePreview).toContainText(APP_URL);
    await page.waitForTimeout(250);
    for (const [width, height] of [[320, 568], [360, 740], [390, 844]] as const) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(250);
      const bounds = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, height: rect.height };
      });
      assert.ok(bounds.x >= 7 && bounds.right <= width - 7, `dialog fits horizontally at ${width}px`);
      assert.ok(bounds.y >= 7 && bounds.bottom <= height - 7, `dialog fits vertically at ${height}px`);
      assert.ok(bounds.height <= height - 14, `dialog height is capped at ${height}px`);
      const previewLayout = await messagePreview.evaluate((element) => ({
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        overflowY: getComputedStyle(element).overflowY,
      }));
      assert.ok(previewLayout.scrollHeight <= previewLayout.clientHeight + 1, "full message preview is visible without nested scrolling");
      assert.notEqual(previewLayout.overflowY, "auto");
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

    await page.keyboard.press("Escape");
    await page.getByTestId("button-language").click();
    const englishTelegramLink = page.getByRole("link", { name: "Join channel" });
    await expect(englishTelegramLink).toHaveAttribute("href", "https://t.me/ethiopandalanguages");
    await expect(page.getByText("Get release notes, help, and answers from our team.")).toBeVisible();
    await page.getByTestId("button-share").click();
    const englishPreview = page.getByTestId("preview-share-message");
    await expect(englishPreview).toContainText(`${APP_NAME} — Stronger Business connections start with a better conversation.`);
    await expect(englishPreview).toContainText("Start your 88-hour free trial learning, then subscribe quarterly or full package");
    await expect(englishPreview).toContainText("Excell in your Business in Africa.:");
    await expect(englishPreview).toContainText(APP_URL);

    console.log("PASS: invitation QR encodes the public Ethio Panda URL and downloads as a valid PNG.");
  } finally {
    await context.close();
    await browser.close();
  }
});
