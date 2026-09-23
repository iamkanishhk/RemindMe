import { Router } from 'express';
import { createPhoneNumberSchema, verifyPhoneNumberSchema } from '../lib/validators';
import { asyncHandler, rateLimited } from '../lib/errors';
import { RateLimiter } from '../lib/ratelimit';
import { geoAllowedPrefixes } from '../config';
import { normalizeE164 } from '../lib/e164';
import * as phoneService from '../services/phoneService';
import * as phoneRepo from '../repos/phoneNumbers';
import { requireAuth } from '../middleware/auth';

export const phoneNumbersRouter = Router();

async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const result = await new RateLimiter(windowSeconds, limit).check(key, limit, windowSeconds);
  if (!result.allowed) throw rateLimited();
}

phoneNumbersRouter.use(requireAuth());

phoneNumbersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const phones = await phoneRepo.listPhonesForUser(req.user!.id);
    res.json({
      phoneNumbers: phones.map((p) => ({
        id: p.id,
        e164: p.e164,
        verified: p.verified,
        createdAt: p.createdAt.toISOString()
      }))
    });
  })
);

phoneNumbersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { e164 } = createPhoneNumberSchema.parse(req.body);
    const normalized = normalizeE164(e164)!;
    phoneService.validateSupportedCountry(normalized, geoAllowedPrefixes());
    await checkRateLimit(`phone-create:${req.user!.id}`, 10, 3600);

    const created = await phoneService.addPhoneNumber(req.user!.id, normalized);
    res.status(201).json({ phoneNumber: { id: created.id, e164: created.e164, verified: created.verified } });
  })
);

phoneNumbersRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const body = verifyPhoneNumberSchema.parse(req.body);
    const e164 = normalizeE164(body.e164)!;
    const verified = await phoneService.verifyPhoneNumber(req.user!.id, e164, body.clerkVerificationId);
    res.json({ phoneNumber: { id: verified.id, e164: verified.e164, verified: verified.verified } });
  })
);

phoneNumbersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const force = req.query.force === 'true';
    const result = await phoneService.deletePhoneNumber(req.user!.id, id, force);
    res.json(result);
  })
);