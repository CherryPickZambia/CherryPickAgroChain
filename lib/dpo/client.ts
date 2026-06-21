/**
 * Client-side helpers for DPO hosted card checkout.
 */

export type DpoCallbackContext = 'marketplace' | 'wallet';

export interface DpoCreateTokenRequest {
  reference: string;
  amount: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
  /** Where DPO should redirect after payment (defaults to marketplace checkout). */
  callback?: DpoCallbackContext;
}

export interface DpoCreateTokenResponse {
  success: boolean;
  paymentUrl?: string;
  reference?: string;
  transToken?: string;
  error?: string;
}

export interface DpoVerifyResponse {
  success: boolean;
  paid: boolean;
  pending: boolean;
  failed: boolean;
  result?: string;
  explanation?: string;
  error?: string;
}

export async function startDpoCardPayment(
  payload: DpoCreateTokenRequest,
): Promise<DpoCreateTokenResponse> {
  const response = await fetch('/api/dpo/create-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to start card payment');
  }
  return data;
}

export async function verifyDpoCardPayment(transToken: string): Promise<DpoVerifyResponse> {
  const response = await fetch('/api/dpo/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transToken }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify card payment');
  }
  return data;
}

export const DPO_PENDING_CHECKOUT_KEY = 'agrochain_dpo_pending_checkout';
export const DPO_PENDING_WALLET_DEPOSIT_KEY = 'agrochain_dpo_pending_wallet_deposit';
