import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("mobile navigation controls stay separated and clear of the hero in Chinese and English", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 60_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

  try {
    await page.goto(base);
    await page.addStyleTag({ content: "#replit-dev-banner { display: none !important; pointer-events: none !important; }" });
    for (const [locale, toggle] of [["zh-CN", false], ["en", true]] as const) {
      if (toggle) await page.getByTestId("button-language").click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);

      for (const width of [320, 360, 390, 402]) {
        await page.setViewportSize({ width, height: 874 });
        const layout = await page.evaluate(() => {
          const selectors = ["[data-testid='link-home']", "[data-testid='button-language']", "[data-testid='button-theme-toggle']", "[data-testid='button-login']", "[data-testid='button-signup']"];
          const boxes = selectors.map((selector) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (!element) throw new Error(`Missing navigation element: ${selector}`);
            const { x, y, right, bottom } = element.getBoundingClientRect();
            return { selector, x, y, right, bottom };
          });
          const nav = document.querySelector("nav")!.getBoundingClientRect();
          const hero = document.querySelector<HTMLElement>("[data-testid='brand-slogan']")!.getBoundingClientRect();
          const overlaps: string[] = [];
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              if (a.x < b.right - 1 && a.right > b.x + 1 && a.y < b.bottom - 1 && a.bottom > b.y + 1) {
                overlaps.push(`${a.selector} overlaps ${b.selector}`);
              }
            }
          }
          return { boxes, navHeight: nav.height, navBottom: nav.bottom, heroTop: hero.top, overlaps };
        });

        assert.deepEqual(layout.overlaps, [], `${locale} at ${width}px`);
        for (const box of layout.boxes) {
          assert.ok(box.x >= -1 && box.right <= width + 1, `${box.selector} stays within ${width}px`);
        }
        assert.ok(layout.navHeight >= 90, `${locale} navigation has enough height for both mobile rows`);
        assert.ok(layout.heroTop >= layout.navBottom - 1, `${locale} hero content starts below the fixed navigation`);
      }
    }
    console.log("PASS: mobile header controls and account buttons do not overlap at 320–402px in Chinese or English.");
  } finally {
    await browser.close();
  }
});
