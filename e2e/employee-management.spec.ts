import { test, expect } from "@playwright/test";

test.describe("Zarządzanie pracownikami", () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie (AUTH-001)
    await page.goto("/login");
    await page.fill("input#email", "admin@example.com"); // Założenie: konto testowe
    await page.fill("input#password", "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
  });

  test("EMP-001 & FORM-001: Powinien dodać nowego pracownika", async ({
    page,
  }) => {
    // Przejdź do zakładki Aktywni
    await page.click('a[href="/aktywni"]');
    await page.waitForURL("**/aktywni");

    // Otwórz formularz dodawania
    await page.click('button:has-text("Dodaj pracownika")');
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Dodaj nowego pracownika" }),
    ).toBeVisible();

    // Wypełnij formularz
    const timestamp = Date.now();
    const uniqueName = `TestUser_${timestamp}`;

    await page.fill("input#firstName", "Jan");
    await page.fill("input#lastName", uniqueName);
    await page.fill("input#cardNumber", `CARD-${timestamp}`);

    // Selecty
    // Dział
    await page.click('button:has-text("Wybierz dział")');
    await page.click('div[role="option"]:first-child');

    // Stanowisko
    await page.click('button:has-text("Wybierz stanowisko")');
    await page.click('div[role="option"]:first-child');

    // Kierownik
    await page.click('button:has-text("Wybierz kierownika")');
    await page.click('div[role="option"]:first-child');

    // Narodowość
    await page.click('button:has-text("Wybierz narodowość")');
    await page.click('div[role="option"]:first-child');

    // Status legalizacyjny
    await page.click('button:has-text("Wybierz status")');
    await page.click('div[role="option"]:has-text("Wiza")');

    // Daty (Używamy dzisiejszej daty z kalendarza)
    await page.click('button:has-text("Wybierz datę")'); // Data zatrudnienia
    await page.click(".rdp-day_today"); // Wybierz dzisiejszy dzień

    await page.click('button:has-text("Data końcowa umowy")'); // Data końca umowy
    await page.click(".rdp-day_today"); // Wybierz dzisiejszy dzień

    // Zapisz
    await page.click('button:has-text("Zapisz")');

    // Weryfikacja: Modal zamknięty i pracownik na liście
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
  });

  test("CARD-002: Powinien edytować pracownika", async ({ page }) => {
    await page.goto("/aktywni");

    // Znajdź pierwszego pracownika i otwórz menu
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.locator('button:has-text("Otwórz menu")').click(); // Button z sr-only

    await page.click('div[role="menuitem"]:has-text("Edytuj")');

    // Sprawdź czy modal edycji się otworzył
    await expect(
      page.getByRole("heading", { name: "Edytuj pracownika" }),
    ).toBeVisible();

    // Zmień numer szafki
    const newLocker = `L-${Date.now()}`;
    await page.fill("input#lockerNumber", newLocker);

    await page.click('button:has-text("Zapisz")');
    await expect(page.getByRole("dialog")).toBeHidden();

    // Opcjonalnie: weryfikacja czy zmiana została zapisana (wymaga ponownego otwarcia edycji lub widoku szczegółów)
  });

  test("CARD-003: Powinien zwolnić pracownika", async ({ page }) => {
    await page.goto("/aktywni");

    // Znajdź pierwszego pracownika (zakładamy, że jest to ten stworzony w teście)
    const firstRow = page.locator("table tbody tr").first();
    const employeeName = await firstRow.locator("td").first().textContent(); // Nazwisko

    await firstRow.locator("button").last().click(); // Menu contextowe (zakładamy kolejność w DOM)

    // Kliknij zwolnij
    await page.click('div[role="menuitem"]:has-text("Zwolnij")');

    // Potwierdź w alert dialogu
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.click('button:has-text("Kontynuuj")');

    // Weryfikacja
    await expect(page.getByRole("alertdialog")).toBeHidden();
    // Pracownik powinien zniknąć z listy (lub test powinien sprawdzić toast)
    await expect(
      page.getByText("Zwolniono pomyślnie").or(page.getByText("Sukces")),
    ).toBeVisible();
  });
});
