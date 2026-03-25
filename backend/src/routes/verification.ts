import { Router } from 'express';
import {
  verifyWork,
  getVerification,
  updateVerification,
  deleteVerification,
} from '../services/verification.js';
import { idempotency } from '../middleware/idempotency.js';
import { validate } from '../middleware/validate.js';
import {
  verificationSchema,
  bulkVerificationSchema,
  bulkUpdateSchema,
  bulkDeleteSchema,
} from '../schemas/index.js';

export const verificationRouter = Router();

// AI-powered work verification
verificationRouter.post('/verify', idempotency(), validate(verificationSchema), async (req, res) => {
  try {
    const { repositoryUrl, milestoneDescription, projectId } = req.body;

    const result = await verifyWork({ repositoryUrl, milestoneDescription, projectId });
    res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Bulk AI-powered work verification
verificationRouter.post('/verify/batch', idempotency(), validate(bulkVerificationSchema), async (req, res) => {
  try {
    const { items } = req.body;

    const results = await Promise.all(
      items.map(async (item: any, index: number) => {
        if (!item?.repositoryUrl || !item?.milestoneDescription || !item?.projectId) {
          return { index, status: 'error', error: 'Missing required fields' };
        }

        try {
          const data = await verifyWork({
            repositoryUrl: item.repositoryUrl,
            milestoneDescription: item.milestoneDescription,
            projectId: item.projectId,
          });
          return { index, status: 'success', data };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Verification failed';
          return { index, status: 'error', error: message };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Bulk verification error:', error);
    res.status(500).json({ message: 'Bulk verification failed' });
  }
});

// Bulk update verification results
verificationRouter.patch('/batch', validate(bulkUpdateSchema), (req, res) => {
  try {
    const { items } = req.body;

    const results = items.map((item: any, index: number) => {
      if (!item?.id) {
        return { index, status: 'error', error: 'Missing verification id' };
      }

      const hasUpdates =
        item.status !== undefined ||
        item.score !== undefined ||
        item.summary !== undefined ||
        item.details !== undefined;

      if (!hasUpdates) {
        return { index, status: 'error', error: 'No update fields provided' };
      }

      const updated = updateVerification({
        id: item.id,
        status: item.status,
        score: item.score,
        summary: item.summary,
        details: item.details,
      });

      if (!updated) {
        return { index, status: 'error', error: 'Verification not found' };
      }

      return { index, status: 'success', data: updated };
    });

    const updatedCount = results.filter((result: any) => result.status === 'success').length;
    res.json({ results, updatedCount });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: 'Bulk update failed' });
  }
});

// Bulk delete verification results
verificationRouter.delete('/batch', validate(bulkDeleteSchema), (req, res) => {
  try {
    const { ids } = req.body;

    const results = ids.map((id: string) => {
      if (!id) {
        return { id, status: 'error', error: 'Missing verification id' };
      }

      const deleted = deleteVerification(id);
      return deleted
        ? { id, status: 'deleted' }
        : { id, status: 'not_found' };
    });

    const deletedCount = results.filter((result: any) => result.status === 'deleted').length;
    res.json({ results, deletedCount });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Bulk delete failed' });
  }
});

// Get verification result by ID
verificationRouter.get('/:id', async (req, res) => {
  try {
    const result = await getVerification(req.params.id);
    if (!result) {
      res.status(404).json({ message: 'Verification not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('Get verification error:', error);
    res.status(500).json({ message: 'Failed to fetch verification' });
  }
});
