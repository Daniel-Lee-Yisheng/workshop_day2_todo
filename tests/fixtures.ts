import { test as base, expect } from '@playwright/test';

/**
 * Extends Playwright's `test` with a virtual WebAuthn authenticator attached to
 * every page, so passwordless register/login works without real hardware.
 */
export const test = base.extend<{ authenticatorId: string }>({
  authenticatorId: [
    async ({ page }, use) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('WebAuthn.enable');
      const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
        options: {
          protocol: 'ctap2',
          transport: 'internal',
          hasResidentKey: true,
          hasUserVerification: true,
          isUserVerified: true,
          automaticPresenceSimulation: true,
        },
      });
      await use(authenticatorId);
      await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
    },
    { auto: true },
  ],
});

export { expect };
