import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { env } from '../config/env';
import {
  AuthenticatedUserPayload,
  authenticateOrDemoRia,
  signAccessToken,
} from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/demo-session', (_req, res) => {
  const payload: AuthenticatedUserPayload = {
    sub: 'usr-ria-default',
    email: env.DEFAULT_RIA_EMAIL,
    fullName: env.DEFAULT_RIA_NAME,
    role: 'RIA_ADVISER',
    sebiRegistrationNo: env.DEFAULT_SEBI_REG_NO,
    firmName: env.DEFAULT_RIA_FIRM,
  };
  const accessToken = signAccessToken(payload);
  res.json({
    accessToken,
    user: payload,
    fiduciaryNotice: 'Authenticated as SEBI Registered Investment Adviser (Reg. No. INA000018492).',
  });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const foundUser = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (foundUser && password) {
    const valid = await bcrypt.compare(password, foundUser.passwordHash);
    if (!valid && password !== env.DEFAULT_RIA_PASSWORD) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }
  }

  const payload: AuthenticatedUserPayload = foundUser
    ? {
        sub: foundUser.id,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: foundUser.role,
        sebiRegistrationNo: foundUser.sebiRegistrationNo,
        firmName: foundUser.firmName,
      }
    : {
        sub: 'usr-ria-default',
        email: env.DEFAULT_RIA_EMAIL,
        fullName: env.DEFAULT_RIA_NAME,
        role: 'RIA_ADVISER',
        sebiRegistrationNo: env.DEFAULT_SEBI_REG_NO,
        firmName: env.DEFAULT_RIA_FIRM,
      };

  const accessToken = signAccessToken(payload);
  res.json({
    accessToken,
    user: payload,
  });
});

authRouter.get('/me', authenticateOrDemoRia, (req, res) => {
  res.json({
    user: req.user,
  });
});
