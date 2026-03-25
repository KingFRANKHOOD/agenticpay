import { Router } from 'express';
import { generateInvoice } from '../services/invoice.js';
import { idempotency } from '../middleware/idempotency.js';
import { validate } from '../middleware/validate.js';
import { invoiceSchema } from '../schemas/index.js';

export const invoiceRouter = Router();

// AI-powered invoice generation
invoiceRouter.post('/generate', idempotency(), validate(invoiceSchema), async (req, res) => {
  try {
    const { projectId, workDescription, hoursWorked, hourlyRate } = req.body;

    const invoice = await generateInvoice({
      projectId,
      workDescription,
      hoursWorked: hoursWorked || 0,
      hourlyRate: hourlyRate || 0,
    });

    res.json(invoice);
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ message: 'Invoice generation failed' });
  }
});
