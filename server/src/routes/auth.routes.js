import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

export const authRouter = Router();

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production'
};

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['Admin', 'Manager', 'Employee', 'Viewer']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function issueAuthResponse(res, user, refreshToken) {
  const accessToken = signAccessToken(user);
  res.cookie('accessToken', accessToken, authCookieOptions);
  res.cookie('refreshToken', refreshToken, authCookieOptions);
  return accessToken;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    lastLoginAt: user.lastLoginAt
  };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    const passwordHash = await User.hashPassword(input.password);
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role || 'Employee',
      lastLoginAt: new Date()
    });
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    const accessToken = issueAuthResponse(res, user, refreshToken);
    res.status(201).json({ user: publicUser(user), accessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });

    if (!user || !(await user.verifyPassword(input.password)) || !user.active) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    const accessToken = issueAuthResponse(res, user, refreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      res.status(401);
      throw new Error('Refresh token required');
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.refreshTokenHash !== hashToken(token) || !user.active) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    const nextRefreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(nextRefreshToken);
    await user.save();
    const accessToken = issueAuthResponse(res, user, nextRefreshToken);
    res.json({ user: publicUser(user), accessToken });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshTokenHash: '' } });
    res.clearCookie('accessToken', authCookieOptions);
    res.clearCookie('refreshToken', authCookieOptions);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});
