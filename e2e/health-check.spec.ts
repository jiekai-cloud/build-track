import { test, expect } from '@playwright/test';

test.describe('Application Health Checks', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the base URL
        await page.goto('/');
    });

    test('should load the application and enter app as guest', async ({ page }) => {
        // Check if the title is correct or welcome modal is shown
        await expect(page.locator('text=Quality of Life')).toBeVisible();

        // Click Guest Mode
        const guestBtn = page.locator('button', { hasText: '體驗模式免登入預覽' }).or(page.locator('button', { hasText: '體驗帳戶' }).first());

        // Some logic to handle modal or directly click
        // First, let's see if there's a guest mode button.
        const isGuestBtnVisible = await guestBtn.isVisible();
        if (isGuestBtnVisible) {
            await guestBtn.click();
        }

        // Modal might pop up (Welcome tutorial etc.)
        const startTourBtn = page.locator('button', { hasText: '開始使用' });
        if (await startTourBtn.isVisible()) {
            await startTourBtn.click();
        }

        // Verify main navigation loads
        await expect(page.locator('nav')).toBeVisible();

        // Verify Dashboard is active
        await expect(page.locator('h1', { hasText: '總覽面板' })).toBeVisible();
    });

    test('should navigate to Calendar View successfully', async ({ page }) => {
        await page.goto('/');

        // Login as guest
        const guestBtn = page.locator('button', { hasText: '體驗帳戶' }).first();
        if (await guestBtn.isVisible()) await guestBtn.click();

        const startTourBtn = page.locator('button', { hasText: '開始使用' });
        if (await startTourBtn.isVisible()) await startTourBtn.click();

        // Click Calendar Tab
        const calendarTab = page.locator('button', { hasText: '行事曆' });
        await calendarTab.click();

        // Verify calendar loaded
        await expect(page.locator('h1', { hasText: '行事曆' })).toBeVisible();
        await expect(page.locator('.rbc-calendar')).toBeVisible();
    });

    test('should navigate to Project Management successfully', async ({ page }) => {
        await page.goto('/');

        const guestBtn = page.locator('button', { hasText: '體驗帳戶' }).first();
        if (await guestBtn.isVisible()) await guestBtn.click();

        const startTourBtn = page.locator('button', { hasText: '開始使用' });
        if (await startTourBtn.isVisible()) await startTourBtn.click();

        // Click Projects Tab
        const projectsTab = page.locator('button', { hasText: '專案管理' });
        await projectsTab.click();

        // Verify projects loaded
        await expect(page.locator('h1', { hasText: '專案管' })).toBeVisible(); // Might be '專案管理' 
    });
});
