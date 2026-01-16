
/**
 * This is an end-to-end test script for the application.
 *
 * To run this test, you need a test runner (like tsx or a custom script)
 * that provides a global `browser_eval` function which is a proxy to the
 * playwright-mcp server.
 *
 * This test assumes:
 * - The application is running on http://localhost:3000
 * - An admin user exists with credentials: admin@example.com / password123
 *
 * It will create screenshots in the `tests/output` directory.
 */

// This would be provided by the test runner environment.
declare const browser_eval: (args: any) => Promise<any>;

const BASE_URL = 'http://localhost:3000';
const screenshotsPath = 'tests/output';
let testCounter = 1;

// Helper to create sequentially numbered screenshots
async function takeScreenshot(name: string) {
    const paddedCounter = String(testCounter++).padStart(2, '0');
    await browser_eval({ action: 'screenshot', path: `${screenshotsPath}/${paddedCounter}-${name}.png` });
}

async function waitForSelector(selector: string, timeout = 10000, visible = true) {
    console.log(`Waiting for selector: "${selector}"`);
    try {
        const result = await browser_eval({
            action: 'evaluate',
            script: `
                new Promise((resolve, reject) => {
                    let attempts = 0;
                    const interval = setInterval(() => {
                        const element = document.querySelector('${selector}');
                        const isVisible = element && window.getComputedStyle(element).display !== 'none';
                        if (element && (${visible} ? isVisible : true)) {
                            clearInterval(interval);
                            resolve(true);
                        }
                        attempts++;
                        if (attempts > ${timeout / 100}) {
                            clearInterval(interval);
                            reject(new Error("Timeout waiting for selector: ${selector}"));
                        }
                    }, 100);
                })
            `
        });
        if (!result.result) throw new Error('Evaluation failed while waiting for selector.');
    } catch (e) {
        console.error(`Error waiting for selector: ${selector}`, e);
        await takeScreenshot('error-wait-for-selector');
        throw e;
    }
}

async function runTest() {
    console.log('--- Starting Comprehensive E2E Test Suite ---');
    await browser_eval({ action: 'start', headless: true, browser: 'chromium' });

    // Unique name for test entities
    const testId = Date.now();
    const newDepartmentName = `Test Dept ${testId}`;
    const newEmployeeFirstName = 'Test';
    const newEmployeeLastName = `Employee ${testId}`;
    const newEmployeeName = `${newEmployeeFirstName} ${newEmployeeLastName}`;

    try {
        // 1. Login
        console.log('Step 1: Logging in...');
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/login` });
        await waitForSelector('form');
        await browser_eval({
            action: 'fill_form',
            fields: [
                { selector: '#email', value: 'admin@example.com' },
                { selector: '#password', value: 'password123' },
            ],
        });
        await takeScreenshot('login-page');
        await browser_eval({ action: 'click', element: 'button[type="submit"]' });
        await waitForSelector('h1:has-text("Pracownicy aktywni")');
        console.log('Login successful.');
        await takeScreenshot('dashboard-after-login');

        // 2. Configuration Test: Add a new department
        console.log(`Step 2: Adding new department: "${newDepartmentName}"...`);
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/konfiguracja` });
        await waitForSelector('h1:has-text("Konfiguracja")');
        await browser_eval({ action: 'click', element: 'button[role="tab"][value="lists"]' });
        // The accordion item for "Działy"
        await browser_eval({ action: 'click', element: 'button[data-radix-accordion-trigger]:has-text("Działy")' });
        await browser_eval({ action: 'click', element: 'button:has-text("Dodaj nowe")' });
        await waitForSelector('#new-items-text');
        await browser_eval({ action: 'type', element: '#new-items-text', text: newDepartmentName });
        await browser_eval({ action: 'click', element: 'button:has-text("Dodaj")' });
        await waitForSelector(`span:has-text("${newDepartmentName}")`);
        await takeScreenshot('department-added');
        console.log('  - OK: Department added successfully.');

        // 3. Employee Management Test: Add, verify, filter, terminate
        console.log(`Step 3: Adding new employee: "${newEmployeeName}"...`);
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/aktywni` });
        await waitForSelector('h1:has-text("Pracownicy aktywni")');
        await browser_eval({ action: 'click', element: 'button:has-text("Dodaj pracownika")' });
        await waitForSelector('h2.text-lg.font-semibold:has-text("Dodaj nowego pracownika")'); // Dialog title
        
        await browser_eval({ action: 'type', selector: '#firstName', text: newEmployeeFirstName });
        await browser_eval({ action: 'type', selector: '#lastName', text: newEmployeeLastName });
        await browser_eval({ action: 'type', selector: '#cardNumber', text: `${testId}` });
        
        // Select from dropdowns
        await browser_eval({ action: 'click', element: 'button[role="combobox"]:has-text("Wybierz stanowisko")' });
        await browser_eval({ action: 'click', element: '[role="option"]:has-text("Operator Maszyn")' });
        
        await browser_eval({ action: 'click', element: 'button[role="combobox"]:has-text("Wybierz dział")' });
        await browser_eval({ action: 'click', element: `[role="option"]:has-text("${newDepartmentName}")` });
        
        await browser_eval({ action: 'click', element: 'button[role="combobox"]:has-text("Wybierz kierownika")' });
        await browser_eval({ action: 'click', element: '[role="option"]:has-text("Janusz Kowalski")' });

        await browser_eval({ action: 'click', element: 'button[role="combobox"]:has-text("Wybierz narodowość")' });
        await browser_eval({ action: 'click', element: '[role="option"]:has-text("Polska")' });

        await browser_eval({ action: 'click', element: 'button[role="combobox"]:has-text("Wybierz status")' });
        await browser_eval({ action: 'click', element: '[role="option"]:has-text("Wiza")' });

        // Click a date in calendar
        await browser_eval({ action: 'click', element: 'button.rdp-button_today' });
        
        await browser_eval({ action: 'click', element: 'button:has-text("Zapisz")' });

        await waitForSelector(`span:has-text("${newEmployeeName}")`);
        await takeScreenshot('employee-added');
        console.log('  - OK: Employee added successfully.');

        console.log('Step 3.1: Filtering for new employee...');
        await browser_eval({ action: 'type', element: 'input[placeholder*="Szukaj"]', text: newEmployeeName });
        await waitForSelector(`span:has-text("${newEmployeeName}")`);
        const rowCount = await browser_eval({ action: 'evaluate', script: 'document.querySelectorAll("table tbody tr").length'});
        if (rowCount.result !== 1) throw new Error(`Filter test failed! Expected 1 row, found ${rowCount.result}`);
        await takeScreenshot('employee-filtered');
        console.log('  - OK: Filtering works.');
        await browser_eval({ action: 'click', element: 'button:has-text("Wyczyść filtry")' });

        console.log('Step 3.2: Testing AI Summary...');
        await browser_eval({ action: 'click', element: `tr:has-text("${newEmployeeName}") button[aria-label="Otwórz menu"]` });
        await browser_eval({ action: 'click', element: 'div[role="menuitem"]:has-text("Generuj podsumowanie")' });
        await waitForSelector('button:has-text("Generuj podsumowanie")');
        await browser_eval({ action: 'click', element: 'button:has-text("Generuj podsumowanie")' });
        await waitForSelector('.prose p'); // Wait for summary text
        await takeScreenshot('employee-ai-summary');
        console.log('  - OK: AI Summary dialog opened and generated.');
        await browser_eval({ action: 'click', element: 'button:has-text("Zamknij")' });

        console.log('Step 3.3: Terminating employee...');
        await browser_eval({ action: 'click', element: `tr:has-text("${newEmployeeName}") button[aria-label="Otwórz menu"]` });
        await browser_eval({ action: 'click', element: '[role="menuitem"]:has-text("Zwolnij")' });
        await waitForSelector('h2.text-lg.font-semibold:has-text("Czy jesteś absolutnie pewien?")');
        await browser_eval({ action: 'click', element: 'button:has-text("Kontynuuj")' });
        await waitForSelector('div[role="alert"]:has-text("Pracownik zwolniony")');
        console.log('  - OK: Employee terminated.');

        // 4. Terminated Employee Test
        console.log('Step 4: Verifying employee in terminated list...');
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/zwolnieni` });
        await waitForSelector(`span:has-text("${newEmployeeName}")`);
        await takeScreenshot('employee-terminated-list');
        console.log('  - OK: Employee found in terminated list.');

        console.log('Step 4.1: Restoring employee...');
        await browser_eval({ action: 'click', element: `tr:has-text("${newEmployeeName}") button[aria-label="Otwórz menu"]` });
        await browser_eval({ action: 'click', element: '[role="menuitem"]:has-text("Przywróć")' });
        await waitForSelector('h2.text-lg.font-semibold:has-text("Czy jesteś absolutnie pewien?")');
        await browser_eval({ action: 'click', element: 'button:has-text("Przywróć")' });
        await waitForSelector('div[role="alert"]:has-text("Pracownik został przywrócony")');
        console.log('  - OK: Employee restored.');

        // 5. Verify Restoration & Deletion
        console.log('Step 5: Verifying employee is back in active list...');
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/aktywni` });
        await waitForSelector(`span:has-text("${newEmployeeName}")`);
        console.log('  - OK: Employee is back in active list.');
        
        console.log('Step 5.1: Permanently deleting employee...');
        await browser_eval({ action: 'click', element: `tr:has-text("${newEmployeeName}") button[aria-label="Otwórz menu"]` });
        await browser_eval({ action: 'click', element: '[role="menuitem"]:has-text("Usuń trwale")' });
        await waitForSelector('h2.text-lg.font-semibold:has-text("Czy jesteś absolutnie pewien?")');
        await browser_eval({ action: 'click', element: 'button:has-text("Usuń trwale")' });
        await waitForSelector('div[role="alert"]:has-text("Pracownik został trwale usunięty")');
        const employeeGone = await browser_eval({ action: 'evaluate', script: `!document.querySelector('span:has-text("${newEmployeeName}")')`});
        if (!employeeGone.result) throw new Error("Employee was not deleted from UI.");
        console.log('  - OK: Employee permanently deleted.');

        // 6. Statistics Report Test
        console.log('Step 6: Testing statistics report generation...');
        await browser_eval({ action: 'navigate', url: `${BASE_URL}/statystyki` });
        await waitForSelector('button[role="tab"][value="hires_fires"]');
        await browser_eval({ action: 'click', element: 'button[role="tab"][value="hires_fires"]' });
        await waitForSelector('#date'); // Date picker button
        await browser_eval({ action: 'click', element: '#date' });
        // Select today's date in the calendar
        const todayDay = new Date().getDate();
        await browser_eval({ action: 'click', element: `button.rdp-button_today:has-text("${todayDay}")` });
        await browser_eval({ action: 'click', element: 'button:has-text("Generuj raport")' });
        await waitForSelector('h3:has-text("Statystyki na dzień")');
        await takeScreenshot('statistics-report');
        console.log('  - OK: Statistics report generated successfully.');

        // 7. Final Check for Console Errors
        console.log('Step 7: Checking for any console errors during the test...');
        const consoleResult = await browser_eval({ action: 'console_messages', errorsOnly: true });
        if (consoleResult?.messages?.length > 0) {
            console.error('  - FOUND CONSOLE ERRORS:', consoleResult.messages);
            throw new Error('Test failed due to console errors.');
        }
        console.log('  - OK: No console errors found.');

    } catch (error) {
        console.error('--- E2E Test Suite FAILED ---', error);
        await takeScreenshot('final-error');
        throw error; // Re-throw to fail the overall process
    } finally {
        console.log('--- E2E Test Suite FINISHED ---');
        await browser_eval({ action: 'close' });
    }
}

// To run the test, this file would be executed by a runner like tsx.
// For now, we are just creating the test file.
// runTest();
