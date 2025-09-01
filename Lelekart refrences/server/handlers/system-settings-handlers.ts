import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Get a specific system setting by key
export async function getSystemSettingHandler(req: Request, res: Response) {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Setting key is required' });
    }
    
    // Only allow admin access
    if (req.user?.role !== 'admin' && req.user?.role !== 'co-admin') {
      return res.status(403).json({ error: 'You do not have permission to access system settings' });
    }
    
    const setting = await storage.getSystemSetting(key);
    
    if (!setting) {
      return res.status(404).json({ error: `Setting with key "${key}" not found` });
    }
    
    return res.status(200).json(setting);
  } catch (error) {
    console.error("Error fetching system setting:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get all system settings
export async function getAllSystemSettingsHandler(req: Request, res: Response) {
  try {
    // Only allow admin access
    if (req.user?.role !== 'admin' && req.user?.role !== 'co-admin') {
      return res.status(403).json({ error: 'You do not have permission to access system settings' });
    }
    
    const settings = await storage.getAllSystemSettings();
    
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching all system settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update or create a system setting
export async function updateSystemSettingHandler(req: Request, res: Response) {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Setting key is required' });
    }
    
    // Only allow admin access
    if (req.user?.role !== 'admin' && req.user?.role !== 'co-admin') {
      return res.status(403).json({ error: 'You do not have permission to update system settings' });
    }
    
    const settingSchema = z.object({
      value: z.string(),
      description: z.string().optional()
    });
    
    const validatedData = settingSchema.parse(req.body);
    
    const updatedSetting = await storage.createOrUpdateSystemSetting(
      key, 
      validatedData.value, 
      validatedData.description
    );
    
    return res.status(200).json(updatedSetting);
  } catch (error) {
    console.error("Error updating system setting:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}