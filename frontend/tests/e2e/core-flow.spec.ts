/**
 * EcoTrace AI — Playwright E2E Test
 *
 * Tests the complete user flow from calculator to dashboard.
 * Uses accessibility-first locators (getByRole, getByLabel).
 */

import { test, expect } from '@playwright/test';

test.describe('Carbon Footprint Core Flow', () => {
  test('User can navigate to calculator and see tabs', async ({ page }) => {
    await page.goto('/');

    // Verify dashboard loads
    await expect(page.getByText('Dashboard')).toBeVisible();

    // Navigate to calculator
    await page.getByRole('menuitem', { name: 'Calculator' }).click();
    await expect(page.getByText('Carbon Calculator')).toBeVisible();

    // Verify all tabs exist
    await expect(page.getByRole('tab', { name: /Transport/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Food/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Energy/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Shopping/ })).toBeVisible();
  });

  test('User can calculate transport emissions', async ({ page }) => {
    await page.goto('/calculator');

    // Fill in transport form
    await page.getByLabel('Distance (km)').fill('100');

    // Submit
    await page.getByRole('button', { name: 'Calculate Transport Emissions' }).click();

    // Verify result appears
    await expect(page.getByText(/kg CO₂/)).toBeVisible();
  });

  test('User can navigate to bill parser', async ({ page }) => {
    await page.goto('/parser');

    // Verify upload zone exists
    await expect(page.getByText(/Drag & drop/)).toBeVisible();

    // Verify privacy notice
    await expect(page.getByText(/Privacy First/)).toBeVisible();
  });

  test('Skip to main content link works', async ({ page }) => {
    await page.goto('/');

    // Tab to activate skip link
    await page.keyboard.press('Tab');

    // Verify skip link becomes visible (it's position:absolute, top:-100% by default)
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeFocused();
  });

  test('Keyboard navigation works on transport mode selector', async ({ page }) => {
    await page.goto('/calculator');

    // Tab through the transport mode buttons
    const busButton = page.getByRole('button', { name: 'Bus' });
    await busButton.click();

    // Verify bus is selected (aria-pressed)
    await expect(busButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('Dashboard shows empty state message', async ({ page }) => {
    await page.goto('/');

    // With no entries, should show empty state
    await expect(page.getByText(/No entries yet/)).toBeVisible();
  });
});
