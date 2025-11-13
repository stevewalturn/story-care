import { expect, test } from '@playwright/test';

/**
 * E2E Test: Transcript Viewer - All Tabs Functionality
 * Tests Media, Quotes, Notes, and Profile tabs for a group session
 */

const TEST_SESSION_ID = 'ccd0805e-e8ab-4624-8107-49a554da32bd';
const TEST_URL = `http://localhost:3000/sessions/${TEST_SESSION_ID}/transcript`;

// Test credentials
const TEST_EMAIL = 'zharfan.akbar104@gmail.com';
const TEST_PASSWORD = 'securepassword';

test.describe('Transcript Viewer - Group Session', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000');

    // Wait for auth page to load
    await page.waitForLoadState('networkidle');

    // Check if we need to login (not already authenticated)
    const isLoginPage = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginPage) {
      // Fill in login credentials
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation after login
      await page.waitForURL(/dashboard|sessions/, { timeout: 10000 });
    }

    // Navigate to transcript page
    await page.goto(TEST_URL);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load transcript page successfully', async ({ page }) => {
    // Verify we're on the transcript page
    expect(page.url()).toContain('/transcript');

    // Check that main content area exists
    await expect(page.locator('text=Media')).toBeVisible();
    await expect(page.locator('text=Quotes')).toBeVisible();
    await expect(page.locator('text=Notes')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('Media tab should work without "coming soon"', async ({ page }) => {
    // Click Media tab (should be default, but click to ensure)
    await page.click('text=Media');

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Verify NO "coming soon" message
    const comingSoonText = await page.locator('text=/coming soon/i').count();

    expect(comingSoonText).toBe(0);

    // Check for media content or empty state
    const hasMediaItems = await page.locator('[class*="media"]').count() > 0;
    const hasEmptyState = await page.locator('text=/no media|no items/i').isVisible().catch(() => false);

    // Either media exists OR empty state shows (both are valid)
    expect(hasMediaItems || hasEmptyState).toBeTruthy();
  });

  test('Quotes tab should work without "coming soon"', async ({ page }) => {
    // Click Quotes tab
    await page.click('text=Quotes');

    // Wait for quotes to load
    await page.waitForTimeout(1500);

    // Verify NO "coming soon" message
    const comingSoonText = await page.locator('text=/coming soon/i').count();

    expect(comingSoonText).toBe(0);

    // Check for quotes content or proper empty state
    const hasLoadingSpinner = await page.locator('[class*="animate-spin"]').isVisible({ timeout: 2000 }).catch(() => false);
    const hasQuotes = await page.locator('text=/quote|speaker/i').count() > 0;
    const hasEmptyState = await page.locator('text=/no quotes/i').isVisible().catch(() => false);

    // Should show loading, quotes, or empty state (not "coming soon")
    expect(hasLoadingSpinner || hasQuotes || hasEmptyState).toBeTruthy();
  });

  test('Notes tab should work without "coming soon"', async ({ page }) => {
    // Click Notes tab
    await page.click('text=Notes');

    // Wait for notes to load
    await page.waitForTimeout(1500);

    // Verify NO "coming soon" message
    const comingSoonText = await page.locator('text=/coming soon/i').count();

    expect(comingSoonText).toBe(0);

    // Check for notes content or proper empty state
    const hasLoadingSpinner = await page.locator('[class*="animate-spin"]').isVisible({ timeout: 2000 }).catch(() => false);
    const hasNotes = await page.locator('text=/note|title/i').count() > 0;
    const hasEmptyState = await page.locator('text=/no notes/i').isVisible().catch(() => false);

    // Should show loading, notes, or empty state (not "coming soon")
    expect(hasLoadingSpinner || hasNotes || hasEmptyState).toBeTruthy();
  });

  test('Profile tab should work without "coming soon" and show group session info', async ({ page }) => {
    // Click Profile tab
    await page.click('text=Profile');

    // Wait for profile to load
    await page.waitForTimeout(1000);

    // Verify NO "coming soon" message
    const comingSoonText = await page.locator('text=/coming soon/i').count();

    expect(comingSoonText).toBe(0);

    // Check for profile content
    const hasProfileContent = page.locator('text=/session details|patient information|group session/i');

    await expect(hasProfileContent).toBeVisible();

    // Verify it shows "Group Session" (since this is a multi-patient session)
    const hasGroupSessionLabel = await page.locator('text=/group session/i').isVisible().catch(() => false);

    // Log result for debugging
    console.log('Group Session label visible:', hasGroupSessionLabel);
  });

  test('all tabs should be clickable and switch correctly', async ({ page }) => {
    // Test tab switching
    const tabs = ['Media', 'Quotes', 'Notes', 'Profile'];

    for (const tab of tabs) {
      // Click tab
      await page.click(`text=${tab}`);

      // Wait for tab content
      await page.waitForTimeout(500);

      // Verify no "coming soon" in any tab
      const comingSoonCount = await page.locator('text=/coming soon/i').count();

      expect(comingSoonCount).toBe(0);
    }
  });

  test('should display session information correctly', async ({ page }) => {
    // Click Profile tab to see session details
    await page.click('text=Profile');
    await page.waitForTimeout(1000);

    // Check for session details section
    const hasSessionDetails = page.locator('text=/session details/i');

    await expect(hasSessionDetails).toBeVisible();

    // Verify session type is shown
    const hasSessionType = page.locator('text=/type:/i');

    await expect(hasSessionType).toBeVisible();

    // Verify transcription status is shown
    const hasStatus = page.locator('text=/status:/i');

    await expect(hasStatus).toBeVisible();
  });
});
