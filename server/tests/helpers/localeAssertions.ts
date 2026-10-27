import assert from "node:assert/strict";
import { expect, type Page } from "@playwright/test";

/** Native Amharic/Swahili teaching content remains visible. Only the switch
 * back to Chinese may contain Han in an English interface, not whole lessons,
 * stories, dialogs or user-control regions. Checks text and accessible labels. */
export async function expectEnglishInterface(page: Page, flow: string) {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const untranslated = await page.locator("body").evaluate(body => {
    const results: string[] = [];
    const han = new RegExp("\\p{Script=Han}", "u");
    for (const element of Array.from(body.querySelectorAll("*"))) {
      if (element.closest('[data-testid="button-language"], #replit-dev-banner, script, style, noscript')) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || element.getClientRects().length === 0) continue;
      const label = element.closest("[data-testid]")?.getAttribute("data-testid") || element.tagName.toLowerCase();
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType !== Node.TEXT_NODE || !han.test(node.textContent || "")) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        if (range.getBoundingClientRect().width > 0) results.push(`${label}: ${node.textContent!.trim()}`);
      }
      for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value && han.test(value)) results.push(`${label}: ${attribute}=${value}`);
      }
    }
    return Array.from(new Set(results));
  });
  assert.deepEqual(untranslated, [], `${flow}: untranslated English interface text (fix the label or missing dictionary key):\n${untranslated.join("\n")}`);
}
