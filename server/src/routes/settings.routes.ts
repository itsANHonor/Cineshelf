import { Router, Request, Response } from 'express';
import { db } from '../database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/settings
 * Get all settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await db('settings').select('*');
    
    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * GET /api/settings/:key
 * Get a specific setting by key
 */
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await db('settings').where({ key }).first();

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

/**
 * PUT /api/settings/:key
 * Update a setting (protected)
 */
router.put('/:key', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Check if setting exists
    const existingSetting = await db('settings').where({ key }).first();

    if (existingSetting) {
      // Update existing setting
      await db('settings')
        .where({ key })
        .update({ 
          value: String(value),
          updated_at: db.fn.now(),
        });
    } else {
      // Create new setting
      await db('settings').insert({ 
        key, 
        value: String(value),
      });
    }

    const updatedSetting = await db('settings').where({ key }).first();
    res.json({ key: updatedSetting.key, value: updatedSetting.value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * POST /api/settings
 * Update multiple settings at once (protected)
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    if (typeof settings !== 'object' || Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an object' });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const existingSetting = await db('settings').where({ key }).first();

      if (existingSetting) {
        await db('settings')
          .where({ key })
          .update({ 
            value: String(value),
            updated_at: db.fn.now(),
          });
      } else {
        await db('settings').insert({ 
          key, 
          value: String(value),
        });
      }
    }

    // Fetch all settings
    const allSettings = await db('settings').select('*');
    const settingsObj: Record<string, string> = {};
    allSettings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

