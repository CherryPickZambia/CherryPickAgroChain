/**
 * DirectPay Online (DPO) — server-side card payment integration.
 * Same flow as CherryPick: createToken → hosted page → verifyToken.
 */

export interface DpoCreateTokenInput {
  reference: string;
  amount: number;
  redirectUrl: string;
  backUrl: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface DpoCreateTokenResult {
  success: boolean;
  transToken?: string;
  transRef?: string;
  result?: string;
  explanation?: string;
  error?: string;
}

export interface DpoVerifyTokenResult {
  success: boolean;
  paid: boolean;
  result?: string;
  explanation?: string;
  raw: Record<string, string>;
  error?: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseXml(xmlString: string): Record<string, string> {
  const trimmed = xmlString.trim();
  if (!trimmed) return {};

  const out: Record<string, string> = {};
  const tagRegex = /<(\w+)>([^<]*)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(trimmed)) !== null) {
    out[match[1]] = match[2];
  }
  return out;
}

function config() {
  return {
    apiUrl: process.env.DPO_API_URL || 'https://secure.3gdirectpay.com/API/v6/',
    paymentUrl: process.env.DPO_PAYMENT_URL || 'https://secure.3gdirectpay.com/payv2.php',
    companyToken: process.env.DPO_COMPANY_TOKEN || '',
    serviceType: process.env.DPO_SERVICE_TYPE || '',
    currency: process.env.DPO_CURRENCY || 'ZMW',
    ptl: process.env.DPO_PTL || '24',
  };
}

export function isDpoConfigured(): boolean {
  const { companyToken, serviceType } = config();
  return companyToken !== '' && serviceType !== '';
}

export function dpoPaymentUrl(transToken: string): string {
  const { paymentUrl } = config();
  return `${paymentUrl.replace(/\/$/, '')}?ID=${encodeURIComponent(transToken)}`;
}

export function isDpoPaidResult(result?: string | null): boolean {
  return result === '000' || result === '001';
}

export function isDpoPendingResult(result?: string | null): boolean {
  return ['900', '003', '005', '007'].includes(result || '');
}

export function isDpoFailedResult(result?: string | null): boolean {
  return result === '901' || result === '904';
}

export async function createDpoToken(data: DpoCreateTokenInput): Promise<DpoCreateTokenResult> {
  const { apiUrl, companyToken, serviceType, currency, ptl } = config();

  if (!isDpoConfigured()) {
    return { success: false, error: 'DPO is not configured' };
  }

  try {
    const amount = Number(data.amount).toFixed(2);
    const serviceDate = new Date().toISOString().slice(0, 16).replace('T', ' ').replace(/-/g, '/');

    let customer = '';
    if (data.firstName) customer += `<customerFirstName>${esc(data.firstName)}</customerFirstName>`;
    if (data.lastName) customer += `<customerLastName>${esc(data.lastName)}</customerLastName>`;
    if (data.email) customer += `<customerEmail>${esc(data.email)}</customerEmail>`;
    if (data.phone) customer += `<customerPhone>${esc(data.phone)}</customerPhone>`;

    const description = data.description || `AgroChain order ${data.reference}`;

    const body =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<API3G>' +
      `<CompanyToken>${esc(companyToken)}</CompanyToken>` +
      '<Request>createToken</Request>' +
      '<Transaction>' +
      `<PaymentAmount>${esc(amount)}</PaymentAmount>` +
      `<PaymentCurrency>${esc(currency)}</PaymentCurrency>` +
      `<CompanyRef>${esc(data.reference)}</CompanyRef>` +
      `<RedirectURL>${esc(data.redirectUrl)}</RedirectURL>` +
      `<BackURL>${esc(data.backUrl)}</BackURL>` +
      '<CompanyRefUnique>0</CompanyRefUnique>' +
      `<PTL>${esc(ptl)}</PTL>` +
      customer +
      '</Transaction>' +
      '<Services>' +
      '<Service>' +
      `<ServiceType>${esc(serviceType)}</ServiceType>` +
      `<ServiceDescription>${esc(description)}</ServiceDescription>` +
      `<ServiceDate>${esc(serviceDate)}</ServiceDate>` +
      '</Service>' +
      '</Services>' +
      '</API3G>';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body,
    });

    const parsed = parseXml(await response.text());
    const result = parsed.Result;

    if (result === '000' && parsed.TransToken) {
      return {
        success: true,
        transToken: parsed.TransToken,
        transRef: parsed.TransRef,
        result,
        explanation: parsed.ResultExplanation,
      };
    }

    const explanation =
      result === '802'
        ? 'Card payments are not active on this DPO merchant account yet.'
        : parsed.ResultExplanation || 'Could not initiate card payment.';

    return {
      success: false,
      result,
      explanation,
      error: explanation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Could not reach DPO (${message}). Please try again.`,
    };
  }
}

export async function verifyDpoToken(transToken: string): Promise<DpoVerifyTokenResult> {
  const { apiUrl, companyToken } = config();

  if (!isDpoConfigured()) {
    return {
      success: false,
      paid: false,
      raw: {},
      error: 'DPO is not configured',
    };
  }

  try {
    const body =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<API3G>' +
      `<CompanyToken>${esc(companyToken)}</CompanyToken>` +
      '<Request>verifyToken</Request>' +
      `<TransactionToken>${esc(transToken)}</TransactionToken>` +
      '</API3G>';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body,
    });

    const parsed = parseXml(await response.text());
    const result = parsed.Result;

    return {
      success: true,
      paid: isDpoPaidResult(result),
      result,
      explanation: parsed.ResultExplanation,
      raw: parsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      paid: false,
      raw: {},
      error: message,
    };
  }
}
