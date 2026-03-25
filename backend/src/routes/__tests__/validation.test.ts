import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoiceRouter } from '../invoice.js';
import { verificationRouter } from '../verification.js';
import { Request, Response } from 'express';

describe('Schema Validation', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let resJson: any;
  let resStatus: any;

  beforeEach(() => {
    resJson = vi.fn();
    resStatus = vi.fn().mockReturnValue({ json: resJson });
    mockReq = { body: {} };
    mockRes = {
      status: resStatus,
    };
  });

  describe('Invoice Validation', () => {
    it('returns 400 when projectId is missing', async () => {
      mockReq.body = { workDescription: 'Test' };
      const handler = (invoiceRouter.stack.find(s => s.route?.path === '/generate')?.route.stack.find((s: any) => s.name === 'validateMiddleware')?.handle);
      
      await handler(mockReq as Request, mockRes as Response, vi.fn());

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ path: 'projectId' })
        ])
      }));
    });
  });

  describe('Verification Validation', () => {
    it('returns 400 when repositoryUrl is invalid', async () => {
      mockReq.body = { 
        repositoryUrl: 'not-a-url',
        milestoneDescription: 'Test',
        projectId: 'P1'
      };
      const handler = (verificationRouter.stack.find(s => s.route?.path === '/verify')?.route.stack.find((s: any) => s.name === 'validateMiddleware')?.handle);
      
      await handler(mockReq as Request, mockRes as Response, vi.fn());

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ path: 'repositoryUrl', message: 'Invalid repository URL' })
        ])
      }));
    });

    it('returns 400 for empty bulk verification items', async () => {
      mockReq.body = { items: [] };
      const handler = (verificationRouter.stack.find(s => s.route?.path === '/verify/batch')?.route.stack.find((s: any) => s.name === 'validateMiddleware')?.handle);
      
      await handler(mockReq as Request, mockRes as Response, vi.fn());

      expect(resStatus).toHaveBeenCalledWith(400);
      expect(resJson).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ path: 'items' })
        ])
      }));
    });
  });
});
