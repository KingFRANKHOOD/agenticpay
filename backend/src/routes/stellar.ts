import { Router } from 'express';
import {
  getAccountInfo,
  getTransactionStatus,
  validateStellarAddress,
  validateTransactionHash,
  ValidationError,
} from '../services/stellar.js';

export const stellarRouter = Router();

// Get Stellar account info
stellarRouter.get('/account/:address', async (req, res) => {
  try {
    validateStellarAddress(req.params.address);
    const account = await getAccountInfo(req.params.address);
    res.json(account);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Stellar account error:', error);
    res.status(500).json({ message: 'Failed to fetch account info' });
  }
});

// Get transaction status
stellarRouter.get('/tx/:hash', async (req, res) => {
  try {
    validateTransactionHash(req.params.hash);
    const tx = await getTransactionStatus(req.params.hash);
    res.json(tx);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    console.error('Stellar tx error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction' });
  }
});
