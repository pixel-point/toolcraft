import { expect, test } from "@playwright/test";

test("browser: starter opens as a neutral Toolcraft shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();

  await expect(page.getByText("Toolcraft App Template Controls")).toHaveCount(0);
  await expect(page.getByText("Generation")).toHaveCount(0);
  await expect(page.getByText("Prompt")).toHaveCount(0);
  await expect(page.getByText("Dur:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Play playback|Pause playback/ })).toHaveCount(0);
});

test("browser: starter canvas accepts media upload without product controls", async ({
  page,
}) => {
  await page.goto("/");

  const upload = await page.evaluateHandle(() => {
    const dataTransfer = new DataTransfer();
    const file = new File(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96"><rect width="128" height="96" fill="#888"/></svg>',
      ],
      "starter-fixture.svg",
      { type: "image/svg+xml" },
    );

    dataTransfer.items.add(file);
    return dataTransfer;
  });

  await page
    .getByRole("application", { name: "Canvas viewport" })
    .dispatchEvent("drop", { dataTransfer: upload });

  await expect(page.getByRole("img", { name: "starter-fixture.svg" })).toBeVisible();
  await expect(page.getByText("Prompt")).toHaveCount(0);
});
