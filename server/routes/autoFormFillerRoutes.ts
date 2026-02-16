import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { eq, desc } from 'drizzle-orm';
import { masterProfiles, profileDocuments, formFillRuns } from '@shared/schema';
import { autoFormFillerService } from '../services/autoFormFillerService';

const router = Router();

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let result;
    if (userId) {
      result = await db.select().from(masterProfiles).where(eq(masterProfiles.userId, userId as string)).limit(1);
    } else {
      result = await db.select().from(masterProfiles).limit(1);
    }
    res.json({ success: true, profile: result[0] || null });
  } catch (error) {
    console.error('Error fetching master profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

router.post('/profile', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const existing = await db.select().from(masterProfiles).limit(1);
    if (existing.length > 0) {
      const updated = await db.update(masterProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(masterProfiles.id, existing[0].id))
        .returning();
      res.json({ success: true, profile: updated[0] });
    } else {
      const created = await db.insert(masterProfiles).values(data).returning();
      res.json({ success: true, profile: created[0] });
    }
  } catch (error) {
    console.error('Error saving master profile:', error);
    res.status(500).json({ success: false, error: 'Failed to save profile' });
  }
});

router.put('/profile/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await db.update(masterProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(masterProfiles.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.json({ success: true, profile: updated[0] });
  } catch (error) {
    console.error('Error updating master profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

router.get('/documents', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query;
    let result;
    if (profileId) {
      result = await db.select().from(profileDocuments)
        .where(eq(profileDocuments.profileId, profileId as string))
        .orderBy(desc(profileDocuments.createdAt));
    } else {
      result = await db.select().from(profileDocuments)
        .orderBy(desc(profileDocuments.createdAt));
    }
    res.json({ success: true, documents: result });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

router.post('/documents', async (req: Request, res: Response) => {
  try {
    const { profileId, docType, docName, fileName, fileSize, textContent, tags, projectRef, expiryDate } = req.body;
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'profileId is required' });
    }

    let extractedData = null;
    if (textContent && docType) {
      extractedData = await autoFormFillerService.extractDocumentData(docType, textContent);
    }

    const created = await db.insert(profileDocuments).values({
      profileId,
      docType: docType || null,
      docName: docName || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      extractedData: extractedData || null,
      tags: tags || null,
      projectRef: projectRef || null,
      expiryDate: expiryDate || null,
    }).returning();

    res.json({ success: true, document: created[0], extractedData });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ success: false, error: 'Failed to create document' });
  }
});

router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.update(profileDocuments)
      .set({ status: "deleted" })
      .where(eq(profileDocuments.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, document: updated[0] });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { docType, textContent } = req.body;
    if (!textContent) {
      return res.status(400).json({ success: false, error: 'textContent is required' });
    }
    const extracted = await autoFormFillerService.extractDocumentData(docType || 'general', textContent);
    res.json({ success: true, extractedData: extracted });
  } catch (error) {
    console.error('Error extracting data:', error);
    res.status(500).json({ success: false, error: 'Failed to extract data' });
  }
});

router.post('/detect-fields', async (req: Request, res: Response) => {
  try {
    const { formText } = req.body;
    if (!formText) {
      return res.status(400).json({ success: false, error: 'formText is required' });
    }
    const result = await autoFormFillerService.detectFormFields(formText);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error detecting fields:', error);
    res.status(500).json({ success: false, error: 'Failed to detect fields' });
  }
});

router.post('/fill', async (req: Request, res: Response) => {
  try {
    const { profileId, formFields, formText, formName, formType } = req.body;
    if (!profileId) {
      return res.status(400).json({ success: false, error: 'profileId is required' });
    }

    const profiles = await db.select().from(masterProfiles).where(eq(masterProfiles.id, profileId)).limit(1);
    if (profiles.length === 0) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    const profile = profiles[0];

    let fields = formFields;
    if (!fields && formText) {
      const detected = await autoFormFillerService.detectFormFields(formText);
      fields = detected.fields;
    }
    if (!fields || fields.length === 0) {
      return res.status(400).json({ success: false, error: 'formFields or formText is required' });
    }

    const preview = await autoFormFillerService.generateFillPreview(profile, fields);

    const run = await db.insert(formFillRuns).values({
      profileId,
      formName: formName || null,
      formType: formType || null,
      fieldsDetected: preview.fieldsDetected,
      fieldsFilled: preview.fieldsFilled,
      fillPercentage: String(preview.fillPercentage),
      fieldMappings: preview.mappings as any,
      missingFields: preview.missing as any,
      status: "completed",
    }).returning();

    res.json({
      success: true,
      run: run[0],
      ...preview,
    });
  } catch (error) {
    console.error('Error running auto-fill:', error);
    res.status(500).json({ success: false, error: 'Failed to run auto-fill' });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query;
    let result;
    if (profileId) {
      result = await db.select().from(formFillRuns)
        .where(eq(formFillRuns.profileId, profileId as string))
        .orderBy(desc(formFillRuns.createdAt));
    } else {
      result = await db.select().from(formFillRuns)
        .orderBy(desc(formFillRuns.createdAt));
    }
    res.json({ success: true, runs: result });
  } catch (error) {
    console.error('Error fetching fill history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
