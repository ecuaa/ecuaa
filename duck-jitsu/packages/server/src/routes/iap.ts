import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import type { Db } from '../db';
import { addCurrency, getUserById, setAdsRemoved } from '../repo/users';
import { serializeProfile } from '../serialize';

export interface IapProduct {
  id: string;
  kind: 'remove_ads' | 'premium_currency';
  name: string;
  priceUsd: number;
  premiumCurrencyAmount?: number;
}

export const IAP_PRODUCTS: IapProduct[] = [
  { id: 'remove_ads', kind: 'remove_ads', name: 'Remove Ads (one-time)', priceUsd: 4.99 },
  { id: 'gems_small', kind: 'premium_currency', name: '80 Gems', priceUsd: 1.99, premiumCurrencyAmount: 80 },
  { id: 'gems_medium', kind: 'premium_currency', name: '350 Gems', priceUsd: 6.99, premiumCurrencyAmount: 350 },
  { id: 'gems_large', kind: 'premium_currency', name: '1000 Gems', priceUsd: 14.99, premiumCurrencyAmount: 1000 },
];

const purchaseSchema = z.object({ productId: z.string() });

export function iapRouter(db: Db): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/products', (_req, res) => {
    res.json({ products: IAP_PRODUCTS });
  });

  // NOTE: This is a mock purchase flow for development/demo purposes. A production build must
  // verify the platform purchase receipt (Apple App Store Server API / Google Play Developer
  // API) server-side before granting entitlements.
  router.post('/purchase', (req, res) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const product = IAP_PRODUCTS.find((p) => p.id === parsed.data.productId);
    if (!product) {
      res.status(400).json({ error: 'Unknown product id' });
      return;
    }
    const user = getUserById(db, req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (product.kind === 'remove_ads') {
      setAdsRemoved(db, user.id);
    } else {
      addCurrency(db, user.id, 'premium', product.premiumCurrencyAmount ?? 0);
    }

    const updated = getUserById(db, user.id)!;
    res.json({ profile: serializeProfile(db, updated) });
  });

  return router;
}
