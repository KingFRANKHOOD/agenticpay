import * as StellarSdk from '@stellar/stellar-sdk';

const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL =
  NETWORK === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// ------- Validation -------

export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a Stellar account address (G… StrKey public key).
 * Uses the Stellar SDK's built-in checksum + base32 verification.
 * @throws {ValidationError} for empty strings, wrong prefix, or malformed encoding.
 */
export function validateStellarAddress(address: string): void {
  if (!address || address.trim().length === 0) {
    throw new ValidationError('Stellar address must not be empty');
  }
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
    throw new ValidationError(
      `Invalid Stellar address: expected a 56-character G… public key, got "${address}"`
    );
  }
}

/**
 * Validates a Stellar transaction hash (64 lowercase hex chars).
 * @throws {ValidationError} for empty strings, wrong length, or non-hex characters.
 */
export function validateTransactionHash(hash: string): void {
  if (!hash || hash.trim().length === 0) {
    throw new ValidationError('Transaction hash must not be empty');
  }
  if (!/^[0-9a-f]{64}$/i.test(hash)) {
    throw new ValidationError(
      `Invalid transaction hash: expected a 64-character hex string, got "${hash}"`
    );
  }
}

// ------- Service functions -------

export async function getAccountInfo(address: string) {
  const account = await server.loadAccount(address);
  return {
    address: account.accountId(),
    balances: account.balances.map((b) => ({
      type: b.asset_type,
      balance: b.balance,
    })),
    sequence: account.sequence,
  };
}

export async function getTransactionStatus(hash: string) {
  const tx = await server.transactions().transaction(hash).call();
  return {
    hash: tx.hash,
    successful: tx.successful,
    ledger: tx.ledger_attr,
    createdAt: tx.created_at,
    memo: tx.memo,
    operationCount: tx.operation_count,
  };
}
