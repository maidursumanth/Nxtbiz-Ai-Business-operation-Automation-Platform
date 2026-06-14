import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = bearer || req.cookies?.accessToken;

    if (!token) {
      res.status(401);
      throw new Error('Authentication required');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash -refreshTokenHash');

    if (!user || !user.active) {
      res.status(401);
      throw new Error('Invalid or inactive user');
    }

    req.user = user;
    next();
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) res.status(401);
    next(error);
  }
}

export function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      next(new Error('Insufficient permissions'));
      return;
    }

    next();
  };
}
