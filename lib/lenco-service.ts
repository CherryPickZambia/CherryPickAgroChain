/**
 * Lenco Payment Service
 * Communicates with the Hostinger VPS Backend to securely process
 * Mobile Money, Bank Transfers, and Collections via Lenco API.
 */

const VPS_API_URL = '/api/lenco';

// ─── TYPES ───────────────────────────────────────────────────

export interface MobileMoneyTransferParams {
    amount: number;
    phone: string;
    network: 'mtn' | 'airtel' | 'zamtel';
    accountName?: string;
    reference?: string;
}

export interface BankTransferParams {
    amount: number;
    accountNumber: string;
    bankId: string;
    narration?: string;
    reference: string;
    country?: string;
}

export interface InternalTransferParams {
    amount: number;
    creditAccountId: string;
    narration?: string;
    reference?: string;
}

export interface MobileMoneyCollectionParams {
    amount: number;
    phone: string;
    operator: 'mtn' | 'airtel' | 'zamtel';
    reference: string;
    country?: string;
    bearer?: 'merchant' | 'customer';
}

export interface CardCollectionParams {
    email: string;
    reference: string;
    amount: number;
    currency: string;
    bearer?: 'merchant' | 'customer';
    customer: {
        firstName: string;
        lastName: string;
    };
    billing: {
        streetAddress: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
    };
    card: {
        number: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
    };
    redirectUrl?: string;
}

export interface Bank {
    id: string;
    name: string;
    country: string;
}

// ─── SERVICE ─────────────────────────────────────────────────

async function vpsRequest(path: string, method = 'GET', body?: unknown) {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${VPS_API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export const lencoService = {
    // ─── TRANSFERS ─────────────────────────────────────────

    /** Send Mobile Money transfer (Airtel/MTN/Zamtel) */
    async sendMobileMoneyTransfer(params: MobileMoneyTransferParams) {
        return vpsRequest('/api/transfers/mobile-money', 'POST', {
            ...params,
            reference: params.reference || `MOMO-${Date.now()}`
        });
    },

    /** Send Bank Account transfer */
    async sendBankTransfer(params: BankTransferParams) {
        return vpsRequest('/api/transfers/bank-account', 'POST', params);
    },

    /** Send Internal transfer to another Lenco account */
    async sendInternalTransfer(params: InternalTransferParams) {
        return vpsRequest('/api/transfers/account', 'POST', {
            ...params,
            reference: params.reference || `INT-${Date.now()}`
        });
    },

    /** Check transfer status by reference */
    async getTransferStatus(reference: string) {
        return vpsRequest(`/api/transfers/status/${reference}`);
    },

    // ─── COLLECTIONS ───────────────────────────────────────

    /** Request Mobile Money payment from a customer */
    async collectMobileMoney(params: MobileMoneyCollectionParams) {
        return vpsRequest('/api/collections/mobile-money', 'POST', params);
    },

    /** Request Card payment from a customer */
    async collectCard(params: CardCollectionParams) {
        return vpsRequest('/api/collections/card', 'POST', params);
    },

    // ─── BANKS ─────────────────────────────────────────────

    /** Get list of banks for Zambia */
    async getBankList(country = 'zm'): Promise<{ success: boolean; data: { data: Bank[] } }> {
        return vpsRequest(`/api/banks?country=${country}`);
    },
};
