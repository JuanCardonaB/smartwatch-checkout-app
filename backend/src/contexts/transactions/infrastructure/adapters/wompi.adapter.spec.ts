import axios from 'axios';
import { WompiAdapter } from './wompi.adapter';
import { CardData } from '../../application/ports/payment-gateway.port';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const INTEGRITY_KEY = 'test_integrity_key';

beforeEach(() => {
  process.env.WOMPI_API_URL = 'https://api-sandbox.test';
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_key';
  process.env.WOMPI_PRIVATE_KEY = 'prv_test_key';
  process.env.WOMPI_INTEGRITY_KEY = INTEGRITY_KEY;
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const card: CardData = {
  number: '4111111111111111',
  holder: 'Juan Cardona',
  expMonth: '12',
  expYear: '2030',
  cvc: '123',
};

const mockMerchantResponse = {
  data: {
    data: { presigned_acceptance: { acceptance_token: 'tok_acceptance', permalink: '', type: '' } },
  },
};

const mockCardTokenResponse = {
  data: {
    data: { id: 'tok_card_123', brand: 'VISA', last_four: '1111', bin: '411111', exp_year: '30', exp_month: '12', card_holder: 'Juan Cardona', expires_at: '' },
  },
};

const mockTransactionResponse = {
  data: {
    data: {
      id: 'wompi-txn-456',
      status: 'APPROVED' as const,
      reference: 'SW-ref',
      amount_in_cents: 30700000,
      currency: 'COP',
      customer_email: 'juan@example.com',
      payment_method: {
        type: 'CARD',
        extra: { last_four: '1111', brand: 'VISA', name: '', exp_year: '', exp_month: '', card_holder: '', external_identifier: '', processor_response_code: '' },
      },
      created_at: '',
      finalized_at: null,
    },
  },
};

// The poll response is what pollUntilFinal returns when it re-fetches the transaction
const mockPollResponse = {
  data: {
    data: {
      ...mockTransactionResponse.data.data,
    },
  },
};

describe('WompiAdapter', () => {
  let adapter: WompiAdapter;

  beforeEach(() => {
    adapter = new WompiAdapter();
    // APPROVED status → pollUntilFinal returns immediately (no polling GET)
    // So only 1 GET (acceptance token) + 2 POSTs (tokenize + transaction)
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce(mockMerchantResponse);
    mockedAxios.post = jest.fn()
      .mockResolvedValueOnce(mockCardTokenResponse)
      .mockResolvedValueOnce(mockTransactionResponse);
  });

  it('returns payment result with wompiId and status', async () => {
    const result = await adapter.processPayment({
      reference: 'SW-ref-1',
      amountInCents: 30700000,
      card,
      customerEmail: 'juan@example.com',
    });

    expect(result.wompiId).toBe('wompi-txn-456');
    expect(result.status).toBe('APPROVED');
    expect(result.cardLastFour).toBe('1111');
    expect(result.cardBrand).toBe('VISA');
  });

  it('sends exp_year as 2 digits to Wompi', async () => {
    await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    const tokenizeCall = mockedAxios.post.mock.calls[0][1] as Record<string, unknown>;
    expect(tokenizeCall['exp_year']).toBe('30');
  });

  it('sends signature as plain string, not an object', async () => {
    await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    const txnCall = mockedAxios.post.mock.calls[1][1] as Record<string, unknown>;
    expect(typeof txnCall['signature']).toBe('string');
  });

  it('builds integrity hash as SHA256(reference + amount + COP + key)', async () => {
    const { createHash } = jest.requireActual<typeof import('crypto')>('crypto');
    const ref = 'SW-ref-hash-test';
    const amount = 30700000;
    const expected = createHash('sha256')
      .update(`${ref}${amount}COP${INTEGRITY_KEY}`)
      .digest('hex');

    await adapter.processPayment({ reference: ref, amountInCents: amount, card, customerEmail: 'j@e.com' });

    const txnCall = mockedAxios.post.mock.calls[1][1] as Record<string, unknown>;
    expect(txnCall['signature']).toBe(expected);
  });

  it('fetches acceptance token via GET and skips polling when status is immediately APPROVED', async () => {
    await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('uses public key for card tokenization header', async () => {
    await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    const tokenizeConfig = mockedAxios.post.mock.calls[0][2] as { headers: Record<string, string> };
    expect(tokenizeConfig.headers['Authorization']).toBe('Bearer pub_test_key');
  });

  it('uses private key for transaction creation header', async () => {
    await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    const txnConfig = mockedAxios.post.mock.calls[1][2] as { headers: Record<string, string> };
    expect(txnConfig.headers['Authorization']).toBe('Bearer prv_test_key');
  });

  it('uses private key for poll GET request header when transaction starts PENDING', async () => {
    const pendingTxnResponse = {
      data: { data: { ...mockTransactionResponse.data.data, status: 'PENDING' as const } },
    };
    const approvedPollResponse = {
      data: { data: { ...mockTransactionResponse.data.data, status: 'APPROVED' as const } },
    };
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce(mockMerchantResponse)
      .mockResolvedValueOnce(approvedPollResponse);
    mockedAxios.post = jest.fn()
      .mockResolvedValueOnce(mockCardTokenResponse)
      .mockResolvedValueOnce(pendingTxnResponse);

    const promise = adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    const pollConfig = mockedAxios.get.mock.calls[1][1] as { headers: Record<string, string> };
    expect(pollConfig.headers['Authorization']).toBe('Bearer prv_test_key');
  });

  it('falls back to **** and UNKNOWN when payment_method extra is missing', async () => {
    const responseWithoutExtra = {
      data: {
        data: {
          ...mockTransactionResponse.data.data,
          payment_method: { type: 'CARD', extra: null as unknown as typeof mockTransactionResponse.data.data.payment_method.extra },
        },
      },
    };
    const pollWithoutExtra = {
      data: {
        data: {
          ...responseWithoutExtra.data.data,
        },
      },
    };
    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce(mockMerchantResponse)
      .mockResolvedValueOnce(pollWithoutExtra);
    mockedAxios.post = jest.fn()
      .mockResolvedValueOnce(mockCardTokenResponse)
      .mockResolvedValueOnce(responseWithoutExtra);

    const result = await adapter.processPayment({ reference: 'SW-ref', amountInCents: 30700000, card, customerEmail: 'j@e.com' });

    expect(result.cardLastFour).toBe('****');
    expect(result.cardBrand).toBe('UNKNOWN');
  });

  it('polls multiple times when initial status is PENDING and resolves on final status', async () => {
    const pendingTxnResponse = {
      data: {
        data: {
          ...mockTransactionResponse.data.data,
          status: 'PENDING' as const,
        },
      },
    };
    const approvedPollResponse = {
      data: {
        data: {
          ...mockTransactionResponse.data.data,
          status: 'APPROVED' as const,
        },
      },
    };

    mockedAxios.get = jest.fn()
      .mockResolvedValueOnce(mockMerchantResponse)
      .mockResolvedValueOnce(approvedPollResponse); // first poll returns APPROVED
    mockedAxios.post = jest.fn()
      .mockResolvedValueOnce(mockCardTokenResponse)
      .mockResolvedValueOnce(pendingTxnResponse);

    const promise = adapter.processPayment({
      reference: 'SW-ref',
      amountInCents: 30700000,
      card,
      customerEmail: 'j@e.com',
    });
    await jest.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result.status).toBe('APPROVED');
  });
});
