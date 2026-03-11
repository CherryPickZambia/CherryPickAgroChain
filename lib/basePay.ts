import { pay, getPaymentStatus } from '@base-org/account';

export interface PaymentRequest {
  amount: string;
  to: string;
  description?: string;
  testnet?: boolean;
  payerInfo?: {
    requests: Array<{
      type: 'email' | 'name' | 'phoneNumber' | 'physicalAddress' | 'onchainAddress';
      optional?: boolean;
    }>;
    callbackURL?: string;
  };
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: string;
  to: string;
  payerInfoResponses?: {
    email?: string;
    name?: { firstName: string; familyName: string };
    phoneNumber?: { number: string; country: string };
    physicalAddress?: any;
    onchainAddress?: string;
  };
}

/**
 * Process a payment using Base Pay
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const payment = await pay({
      amount: request.amount,
      to: request.to,
      testnet: request.testnet ?? false, // Default to mainnet
      payerInfo: request.payerInfo,
    });

    return {
      id: payment.id,
      status: 'pending',
      amount: request.amount,
      to: request.to,
      payerInfoResponses: payment.payerInfoResponses,
    };
  } catch (error: any) {
    console.error('Payment failed:', error);
    throw new Error(`Payment failed: ${error.message}`);
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  paymentId: string,
  testnet: boolean = false
): Promise<{ status: 'pending' | 'completed' | 'failed' }> {
  try {
    const result = await getPaymentStatus({
      id: paymentId,
      testnet,
    });

    return {
      status: result.status as 'pending' | 'completed' | 'failed',
    };
  } catch (error: any) {
    console.error('Failed to check payment status:', error);
    throw new Error(`Failed to check payment status: ${error.message}`);
  }
}

/**
 * Poll payment status until completed or timeout
 */
export async function pollPaymentStatus(
  paymentId: string,
  testnet: boolean = false,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<'completed' | 'failed' | 'timeout'> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { status } = await checkPaymentStatus(paymentId, testnet);

      if (status === 'completed') {
        return 'completed';
      }

      if (status === 'failed') {
        return 'failed';
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error(`Poll attempt ${i + 1} failed:`, error);
    }
  }

  return 'timeout';
}

/**
 * Process milestone payment
 */
export async function processMilestonePayment(
  milestoneId: string,
  amount: string,
  farmerAddress: string,
  testnet: boolean = false
): Promise<PaymentResponse> {
  return processPayment({
    amount,
    to: farmerAddress,
    description: `Milestone payment for ${milestoneId}`,
    testnet,
    payerInfo: {
      requests: [
        { type: 'email' },
        { type: 'onchainAddress' },
      ],
    },
  });
}

/**
 * Process verification fee payment
 */
export async function processVerificationFee(
  taskId: string,
  amount: string,
  officerAddress: string,
  testnet: boolean = false
): Promise<PaymentResponse> {
  return processPayment({
    amount,
    to: officerAddress,
    description: `Verification fee for task ${taskId}`,
    testnet,
  });
}
