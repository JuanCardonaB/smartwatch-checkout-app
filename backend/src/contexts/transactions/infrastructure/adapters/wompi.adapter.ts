import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';
import {
  CardData,
  PaymentGatewayPort,
  PaymentResult,
} from '../../application/ports/payment-gateway.port';

interface WompiMerchantResponse {
  data: {
    presigned_acceptance: {
      acceptance_token: string;
      permalink: string;
      type: string;
    };
  };
}

interface WompiCardTokenResponse {
  data: {
    id: string;
    brand: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

interface WompiTransactionResponse {
  data: {
    id: string;
    status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
    reference: string;
    amount_in_cents: number;
    currency: string;
    customer_email: string;
    payment_method: {
      type: string;
      extra: {
        last_four: string;
        brand: string;
        name: string;
        exp_year: string;
        exp_month: string;
        card_holder: string;
        external_identifier: string;
        processor_response_code: string;
      };
    };
    created_at: string;
    finalized_at: string | null;
  };
}

@Injectable()
export class WompiAdapter implements PaymentGatewayPort {
  private readonly apiUrl =
    process.env.WOMPI_API_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1';
  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY ?? '';
  private readonly privateKey = process.env.WOMPI_PRIVATE_KEY ?? '';
  private readonly integrityKey = process.env.WOMPI_INTEGRITY_KEY ?? '';

  private async getAcceptanceToken(): Promise<string> {
    const { data } = await axios.get<WompiMerchantResponse>(
      `${this.apiUrl}/merchants/${this.publicKey}`,
    );
    return data.data.presigned_acceptance.acceptance_token;
  }

  private async tokenizeCard(card: CardData): Promise<string> {
    const { data } = await axios.post<WompiCardTokenResponse>(
      `${this.apiUrl}/tokens/cards`,
      {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear.slice(-2),
        card_holder: card.holder,
      },
      { headers: { Authorization: `Bearer ${this.publicKey}` } },
    );
    return data.data.id;
  }

  private buildIntegrityHash(reference: string, amountInCents: number): string {
    const raw = `${reference}${amountInCents}COP${this.integrityKey}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  async processPayment(params: {
    reference: string;
    amountInCents: number;
    card: CardData;
    customerEmail: string;
  }): Promise<PaymentResult> {
    const [acceptanceToken, cardToken] = await Promise.all([
      this.getAcceptanceToken(),
      this.tokenizeCard(params.card),
    ]);

    const integrity = this.buildIntegrityHash(
      params.reference,
      params.amountInCents,
    );

    const { data } = await axios.post<WompiTransactionResponse>(
      `${this.apiUrl}/transactions`,
      {
        amount_in_cents: params.amountInCents,
        currency: 'COP',
        customer_email: params.customerEmail,
        payment_method: {
          type: 'CARD',
          token: cardToken,
          installments: 1,
        },
        reference: params.reference,
        signature: integrity,
        acceptance_token: acceptanceToken,
      },
      { headers: { Authorization: `Bearer ${this.privateKey}` } },
    );

    const txn = data.data;
    const finalTxn = await this.pollUntilFinal(txn.id, txn.status);
    return {
      wompiId: finalTxn.id,
      status: finalTxn.status,
      cardLastFour: finalTxn.payment_method?.extra?.last_four ?? '****',
      cardBrand: finalTxn.payment_method?.extra?.brand ?? 'UNKNOWN',
    };
  }

  private async pollUntilFinal(
    wompiId: string,
    initialStatus: WompiTransactionResponse['data']['status'],
    maxWaitMs = 10000,
    intervalMs = 1000,
  ): Promise<WompiTransactionResponse['data']> {
    if (initialStatus !== 'PENDING') {
      const { data } = await axios.get<WompiTransactionResponse>(
        `${this.apiUrl}/transactions/${wompiId}`,
        { headers: { Authorization: `Bearer ${this.privateKey}` } },
      );
      return data.data;
    }

    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, intervalMs));
      const { data } = await axios.get<WompiTransactionResponse>(
        `${this.apiUrl}/transactions/${wompiId}`,
        { headers: { Authorization: `Bearer ${this.privateKey}` } },
      );
      if (data.data.status !== 'PENDING') return data.data;
    }

    // Return last known state after timeout (still PENDING)
    const { data } = await axios.get<WompiTransactionResponse>(
      `${this.apiUrl}/transactions/${wompiId}`,
      { headers: { Authorization: `Bearer ${this.privateKey}` } },
    );
    return data.data;
  }
}
