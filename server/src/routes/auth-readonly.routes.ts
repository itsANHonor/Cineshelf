import { Router, Request, Response } from 'express';
import { verifyPassword } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login with password
 */
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (verifyPassword(password)) {
    return res.json({ 
      success: true, 
      message: 'Authentication successful',
      token: password // In a simple setup, we just return the password as token
    });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

export default router;

