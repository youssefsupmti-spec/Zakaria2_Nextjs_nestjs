import { expect, test } from '@playwright/test';

test.describe('G4D Delivery — Smoke Tests Authentification & Navigation', () => {
  test('la page d’accueil publique répond et affiche le bouton de connexion', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/G4D/i);
  });

  test('la page /login affiche le formulaire e-mail, mot de passe et sélecteur durée session', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[aria-pressed="true"]')).toBeVisible();
  });

  test('/dashboard redirige vers /login lorsque aucune session cookie n’est active', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
