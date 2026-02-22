import { test, expect } from '@playwright/test';

test.describe('Application Health Checks', () => {
    // Vite might take a while to compile on the first request
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

        // Skip onboarding modal by injecting localStorage before anything loads
        await page.addInitScript(() => {
            window.localStorage.setItem('bt_onboarding_completed', 'true');
        });

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');

        // Wait for Loading Screen to either finish or click skip manually (First Time)
        try {
            const skipBtn = page.getByRole('button', { name: '直接進入系統 (跳過等待)' });
            await skipBtn.waitFor({ state: 'attached', timeout: 8000 });
            await skipBtn.click({ force: true });
            await page.waitForTimeout(500);
        } catch (e) {
            console.log('First Skip button error:', e.message);
        }

        // Wait for the Login screen to appear (Wait for Guest Mode Button specifically)
        try {
            const guestBtn = page.locator('button', { hasText: '訪客模式預覽' }).first();
            await guestBtn.waitFor({ state: 'visible', timeout: 10000 });
            await guestBtn.click();

            // Login triggers another LoadingScreen (loadSystemData). We must skip it too.
            try {
                const skipBtn2 = page.getByRole('button', { name: '直接進入系統 (跳過等待)' });
                await skipBtn2.waitFor({ state: 'attached', timeout: 5000 });
                await skipBtn2.click({ force: true });
                await page.waitForTimeout(500);
            } catch (e) {
                console.log('Second Skip button missing or already finished:', e.message);
            }

            // Handle Onboarding Tour if it appears (Should be suppressed by localStorage now)
            try {
                const startTourBtn = page.locator('button', { hasText: '開始使用' });
                await startTourBtn.waitFor({ state: 'visible', timeout: 3000 });
                await startTourBtn.click();
            } catch (e) {
                // Expected to fail since we injected localStorage
            }
        } catch (e) {
            console.log('Error entering guest mode:', e.message);
        }
    });

    test('should load the application and enter app as guest', async ({ page }) => {
        // App auto-redirects to Attendance on login. We must click Dashboard to verify it.
        const dashboardTab = page.locator('button', { hasText: '總覽面板' });
        await dashboardTab.click();

        // Verify Dashboard is active
        await expect(page.locator('h1', { hasText: '智慧指揮中心' })).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to Calendar View successfully', async ({ page }) => {
        // Click Calendar Tab
        const calendarTab = page.locator('button', { hasText: '行事曆' });
        await calendarTab.click();

        // Verify Calendar View loaded
        await expect(page.locator('h1', { hasText: '企業' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to Project Management successfully', async ({ page }) => {
        // Click Projects Tab
        const projectTab = page.locator('button', { hasText: '專案管理' });
        await projectTab.click();

        // Verify projects loaded
        await expect(page.locator('h1', { hasText: '專案財務戰情室' })).toBeVisible({ timeout: 10000 });
    });
});
