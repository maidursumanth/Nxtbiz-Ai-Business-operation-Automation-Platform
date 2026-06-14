import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { rolePermissions } from '../spec/businessRules.js';

export const usersRouter = Router();

const userInputSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['Admin', 'Manager', 'Employee', 'Viewer']),
  active: z.boolean().optional()
});

usersRouter.use(requireAuth);

usersRouter.get('/', requireRoles(rolePermissions.users.list), async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/', requireRoles(rolePermissions.users.create), async (req, res, next) => {
  try {
    const input = userInputSchema.required({ password: true }).parse(req.body);
    const passwordHash = await User.hashPassword(input.password);
    const user = await User.create({ ...input, passwordHash });
    res.status(201).json({ user: { ...user.toObject(), passwordHash: undefined, refreshTokenHash: undefined } });
  } catch (error) {
    next(error);
  }
});

usersRouter.put('/:id', requireRoles(rolePermissions.users.update), async (req, res, next) => {
  try {
    const input = userInputSchema.partial().parse(req.body);
    const update = { ...input };
    if (input.password) {
      update.passwordHash = await User.hashPassword(input.password);
      delete update.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash -refreshTokenHash');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

usersRouter.delete('/:id', requireRoles(rolePermissions.users.delete), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
