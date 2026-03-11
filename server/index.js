import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import dns from 'dns';

// ★ CRITICAL FIX: Force Node.js to prefer IPv4 over IPv6.
// Without this, the VPS connects to Lenco via its IPv6 address
// (2a02:4780:f:9b23::1) instead of the whitelisted IPv4 (46.202.194.248),
// causing "IP Address is not whitelisted" errors.
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());
app.use(morgan('dev'));

const LENCO_API_URL = process.env.LENCO_API_URL || 'https://api.lenco.co/access/v2';
const LENCO_SECRET_KEY = process.env.LENCO_SECRET_KEY;
const LENCO_ACCOUNT_ID = process.env.LENCO_ACCOUNT_ID;

// Helper: make authenticated Lenco API request
async function lencoRequest(path, method = 'GET', body = null) {
    if (!LENCO_SECRET_KEY) {
        throw new Error('LENCO_SECRET_KEY is not configured');
    }
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LENCO_SECRET_KEY}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${LENCO_API_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        console.error(`Lenco API Error [${path}]:`, data);
        const err = new Error(data.message || 'Lenco API request failed');
        err.status = response.status;
        err.details = data;
        throw err;
    }
    return data;
}

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Lenco VPS Backend is running' });
});

// ─── TRANSFERS ───────────────────────────────────────────────

// POST /api/transfers/mobile-money
app.post('/api/transfers/mobile-money', async (req, res) => {
    try {
        const { amount, phone, network, narration, reference } = req.body;

        if (!amount || !phone || !network) {
            return res.status(400).json({ success: false, error: 'Missing required fields: amount, phone, network' });
        }

        const data = await lencoRequest('/transfers/mobile-money', 'POST', {
            accountId: LENCO_ACCOUNT_ID,
            amount: parseFloat(amount),
            phone,
            operator: network.toLowerCase(),
            narration: narration || 'Payment',
            reference: reference || `REF-${Date.now()}`
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Mobile money transfer error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// POST /api/transfers/bank-account
app.post('/api/transfers/bank-account', async (req, res) => {
    try {
        const { amount, narration, reference, accountNumber, bankId, country } = req.body;

        if (!amount || !reference) {
            return res.status(400).json({ success: false, error: 'Missing required fields: amount, reference' });
        }
        if (!accountNumber || !bankId) {
            return res.status(400).json({ success: false, error: 'Missing required fields: accountNumber, bankId' });
        }

        const data = await lencoRequest('/transfers/bank-account', 'POST', {
            accountId: LENCO_ACCOUNT_ID,
            amount: parseFloat(amount),
            narration: narration || 'Bank Transfer',
            reference,
            accountNumber,
            bankId,
            country: country || 'zm'
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Bank transfer error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// POST /api/transfers/account
app.post('/api/transfers/account', async (req, res) => {
    try {
        const { amount, narration, reference, creditAccountId } = req.body;

        if (!amount || !reference || !creditAccountId) {
            return res.status(400).json({ success: false, error: 'Missing required fields: amount, reference, creditAccountId' });
        }

        const data = await lencoRequest('/transfers/account', 'POST', {
            accountId: LENCO_ACCOUNT_ID,
            amount: parseFloat(amount),
            narration: narration || 'Internal Transfer',
            reference,
            creditAccountId
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Internal account transfer error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// ─── COLLECTIONS ─────────────────────────────────────────────

// POST /api/collections/mobile-money
app.post('/api/collections/mobile-money', async (req, res) => {
    try {
        const { amount, reference, phone, operator, country, bearer } = req.body;

        if (!amount || !reference || !phone || !operator) {
            return res.status(400).json({ success: false, error: 'Missing required fields: amount, reference, phone, operator' });
        }

        const data = await lencoRequest('/collections/mobile-money', 'POST', {
            accountId: LENCO_ACCOUNT_ID,
            amount: parseFloat(amount),
            reference,
            phone,
            operator: operator.toLowerCase(),
            country: country || 'zm',
            bearer: bearer || 'merchant'
        });

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Mobile money collection error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// ─── BANKS ───────────────────────────────────────────────────

// GET /api/banks?country=zm
app.get('/api/banks', async (req, res) => {
    try {
        const country = req.query.country || 'zm';
        const data = await lencoRequest(`/banks?country=${country}`, 'GET');
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Bank list error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// ─── TRANSFER STATUS ─────────────────────────────────────────

// GET /api/transfers/status/:reference
app.get('/api/transfers/status/:reference', async (req, res) => {
    try {
        const data = await lencoRequest(`/transfers/status/${req.params.reference}`, 'GET');
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Transfer status error:', error);
        res.status(error.status || 500).json({ success: false, error: error.message, details: error.details });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL configured as: ${process.env.FRONTEND_URL || '*'}`);
    console.log(`DNS resolution order: ipv4first (forced)`);
});
