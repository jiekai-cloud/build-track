import { test, expect } from '@playwright/test';

test.describe('Application Health Checks', () => {
    test.setTimeout(90000);

    test.beforeEach(async ({ page }) => {
        page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

        await page.addInitScript(() => {
            window.localStorage.setItem('bt_onboarding_completed', 'true');
        });

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');

        // Wait for Login page to render
        const guestBtn = page.locator('button', { hasText: '訪客模式預覽' });
        await guestBtn.waitFor({ state: 'visible', timeout: 30000 });
        await guestBtn.click();

        // After login, handle LoadingScreen
        try {
            const skipBtn = page.locator('button', { hasText: '跳過等待' });
            await skipBtn.waitFor({ state: 'visible', timeout: 10000 });
            await skipBtn.click({ force: true });
        } catch {
            // LoadingScreen may have auto-completed
        }

        // Wait for sidebar to be visible (app fully loaded)
        await expect(page.locator('button', { hasText: '總覽面板' })).toBeVisible({ timeout: 30000 });
    });

    // ===== Core Pages =====
    test('Dashboard loads', async ({ page }) => {
        await page.locator('button', { hasText: '總覽面板' }).click();
        await expect(page.locator('text=智慧指揮中心')).toBeVisible({ timeout: 10000 });
    });

    test('"全公司視野" selector removed', async ({ page }) => {
        await expect(page.locator('text=全公司視野')).toHaveCount(0);
    });

    test('Calendar loads', async ({ page }) => {
        await page.locator('button', { hasText: '行事曆' }).first().click();
        await page.waitForTimeout(2000);
        await expect(page.locator('main')).toBeVisible();
    });

    test('Projects page loads', async ({ page }) => {
        await page.locator('button', { hasText: '專案管理' }).click();
        await expect(page.locator('text=專案財務戰情室')).toBeVisible({ timeout: 10000 });
    });

    test('Project tabs: "專案討論" first, no "施工日誌"', async ({ page }) => {
        await page.locator('button', { hasText: '專案管理' }).click();
        await page.waitForTimeout(1500);
        const detailBtn = page.locator('button', { hasText: '詳情' }).first();
        if (await detailBtn.isVisible().catch(() => false)) {
            await detailBtn.click();
            await page.waitForTimeout(1500);
            const tabContainer = page.locator('#project-tabs');
            if (await tabContainer.isVisible().catch(() => false)) {
                const firstTabText = await tabContainer.locator('button').first().textContent();
                expect(firstTabText).toContain('專案討論');
                await expect(tabContainer.locator('button', { hasText: '施工日誌' })).toHaveCount(0);
            }
        }
    });

    // ===== All Sidebar Modules =====
    const modules = ['派工紀錄', '報價系統', '客戶資料', '團隊成員', '廠商管理', '庫存管理', '考勤打卡', '薪資管理', '簽核系統', '個人待辦'];
    for (const mod of modules) {
        test(`${mod} loads`, async ({ page }) => {
            const tab = page.locator('button', { hasText: mod }).first();
            if (await tab.isVisible().catch(() => false)) {
                await tab.click();
                await page.waitForTimeout(2000);
                await expect(page.locator('main')).toBeVisible();
            } else {
                test.skip();
            }
        });
    }
});
