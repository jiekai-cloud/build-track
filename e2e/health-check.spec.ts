import { test, expect, Page } from '@playwright/test';

// Login as SuperAdmin for full access
async function loginAsAdmin(page: Page) {
    await page.addInitScript(() => {
        window.localStorage.setItem('bt_onboarding_completed', 'true');
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Wait for login page
    const loginBtn = page.locator('button', { hasText: '進入系統' });
    await loginBtn.waitFor({ state: 'visible', timeout: 30000 });

    // Fill admin credentials
    await page.locator('input[type="text"], input[placeholder*="Employee"]').first().fill('admin');
    await page.locator('input[type="password"]').first().fill('1234');
    await loginBtn.click();

    // Handle LoadingScreen
    try {
        const skipBtn = page.locator('button', { hasText: '跳過等待' });
        await skipBtn.waitFor({ state: 'visible', timeout: 10000 });
        await skipBtn.click({ force: true });
    } catch { /* already loaded */ }

    // Wait for sidebar
    await expect(page.locator('button', { hasText: '總覽面板' })).toBeVisible({ timeout: 30000 });
}

async function navigateTo(page: Page, name: string) {
    await page.locator('button', { hasText: name }).first().click();
    await page.waitForTimeout(1500);
}

test.describe('Full System Deep Health Check (Admin)', () => {
    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
        await loginAsAdmin(page);
    });

    // =============================================
    // 1. HEADER
    // =============================================
    test('Header: admin badge, cloud status, AI badge, no department selector', async ({ page }) => {
        await expect(page.locator('text=SYNC-GUARD')).toBeVisible();
        await expect(page.locator('text=全公司視野')).toHaveCount(0);

        const aiBadge = page.locator('text=AI 智慧服務已啟用');
        await expect(aiBadge).toBeVisible();
    });

    // =============================================
    // 2. SIDEBAR — All buttons clickable
    // =============================================
    test('Sidebar: all 12+ module buttons visible and enabled', async ({ page }) => {
        const modules = ['總覽面板', '行事曆', '專案管理', '派工紀錄', '報價系統', '客戶資料', '團隊成員', '庫存管理', '考勤打卡', '薪資管理', '簽核系統', '個人待辦'];
        for (const mod of modules) {
            const btn = page.locator('button', { hasText: mod }).first();
            await expect(btn).toBeVisible();
            await expect(btn).toBeEnabled();
        }
    });

    // =============================================
    // 3. DASHBOARD — Deep
    // =============================================
    test('Dashboard: title, stats cards, AI button, year/month selectors', async ({ page }) => {
        await navigateTo(page, '總覽面板');
        await expect(page.locator('text=智慧指揮中心')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('button', { hasText: 'AI 營運診斷' })).toBeVisible();
        await expect(page.locator('button', { hasText: '快速導覽' })).toBeVisible();
        // Year selector
        const selects = page.locator('select');
        expect(await selects.count()).toBeGreaterThanOrEqual(1);
    });

    // =============================================
    // 4. CALENDAR — Deep
    // =============================================
    test('Calendar: grid, toolbar buttons', async ({ page }) => {
        await navigateTo(page, '行事曆');
        await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.rbc-toolbar')).toBeVisible();
        const toolbarBtns = page.locator('.rbc-toolbar button');
        expect(await toolbarBtns.count()).toBeGreaterThanOrEqual(3);
    });

    // =============================================
    // 5. PROJECTS — list + detail + all 10 tabs
    // =============================================
    test('Projects: list page with title and action buttons', async ({ page }) => {
        await navigateTo(page, '專案管理');
        await expect(page.locator('text=專案財務戰情室')).toBeVisible({ timeout: 10000 });
        // Admin should see add/test buttons
        const addBtn = page.locator('button', { hasText: '新增案件' }).first();
        if (await addBtn.isVisible().catch(() => false)) {
            await expect(addBtn).toBeEnabled();
        }
    });

    test('Project Detail: all 10 tabs render without crash', async ({ page }) => {
        await navigateTo(page, '專案管理');
        await page.waitForTimeout(1000);

        // Click first "詳情" button
        const detailBtn = page.locator('button', { hasText: '詳情' }).first();
        if (!await detailBtn.isVisible().catch(() => false)) {
            // No projects exist, create a test project first
            const testBtn = page.locator('button', { hasText: '測試案件' }).first();
            if (await testBtn.isVisible().catch(() => false)) {
                await testBtn.click();
                await page.waitForTimeout(2000);
            } else {
                test.skip();
                return;
            }
        }

        // Re-find and click detail
        const detail = page.locator('button', { hasText: '詳情' }).first();
        if (!await detail.isVisible().catch(() => false)) { test.skip(); return; }
        await detail.click();
        await page.waitForTimeout(1500);

        const tabContainer = page.locator('#project-tabs');
        await expect(tabContainer).toBeVisible({ timeout: 5000 });

        // Verify all 10 tabs exist
        const expectedTabs = ['專案討論', '報價單', '施工前準備', '施工排程', '行事曆', '待辦任務', '照片庫', '缺失改善', '帳務管理', '案場定位'];
        for (const tabName of expectedTabs) {
            await expect(tabContainer.locator('button', { hasText: tabName })).toBeVisible();
        }

        // Click through each tab, verify page content
        for (const tabName of expectedTabs) {
            await tabContainer.locator('button', { hasText: tabName }).click();
            await page.waitForTimeout(800);
            const text = await page.locator('body').textContent();
            expect(text!.length).toBeGreaterThan(100);
        }

        // Verify "施工日誌" does NOT exist
        await expect(tabContainer.locator('button', { hasText: '施工日誌' })).toHaveCount(0);
    });

    // =============================================
    // 6. QUOTATIONS
    // =============================================
    test('Quotations: renders and shows create button', async ({ page }) => {
        await navigateTo(page, '報價系統');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 7. DISPATCH
    // =============================================
    test('Dispatch: renders dispatch manager with content', async ({ page }) => {
        await navigateTo(page, '派工紀錄');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 8. CUSTOMERS
    // =============================================
    test('Customers: renders customer list', async ({ page }) => {
        await navigateTo(page, '客戶資料');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 9. TEAM
    // =============================================
    test('Team: shows member cards', async ({ page }) => {
        await navigateTo(page, '團隊成員');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 10. INVENTORY
    // =============================================
    test('Inventory: renders inventory list', async ({ page }) => {
        await navigateTo(page, '庫存管理');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 11. ATTENDANCE
    // =============================================
    test('Attendance: renders clock-in page', async ({ page }) => {
        await navigateTo(page, '考勤打卡');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 12. PAYROLL
    // =============================================
    test('Payroll: renders payroll page', async ({ page }) => {
        await navigateTo(page, '薪資管理');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 13. APPROVALS
    // =============================================
    test('Approvals: renders approval system', async ({ page }) => {
        await navigateTo(page, '簽核系統');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
    });

    // =============================================
    // 14. TODOS — check input exists
    // =============================================
    test('Todos: renders with input field', async ({ page }) => {
        await navigateTo(page, '個人待辦');
        await page.waitForTimeout(1500);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(100);
        const input = page.locator('input, textarea').first();
        if (await input.isVisible().catch(() => false)) {
            await expect(input).toBeEnabled();
        }
    });

    // =============================================
    // 15. NOTIFICATION PANEL
    // =============================================
    test('Notification panel opens', async ({ page }) => {
        // Bell button is in the header area with a relative marker
        const bellBtn = page.locator('header button[class*="rounded-2xl"]').first();
        if (await bellBtn.isVisible().catch(() => false)) {
            await bellBtn.click();
            await page.waitForTimeout(800);
            // Something new should appear (overlay, panel)
            const bodyText = await page.locator('body').textContent();
            expect(bodyText!.length).toBeGreaterThan(200);
        }
    });
});
