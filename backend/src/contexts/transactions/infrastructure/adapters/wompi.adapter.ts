import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';
import { CardData, PaymentGatewayPort, PaymentResult } from '../../application/ports/payment-gateway.port';

@Injectable()
export class WompiAdapter implements PaymentGatewayPort {
  private readonly apiUrl = process.env.WOMPI_API_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1';
  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY ?? '';
  private readonly privateKey = process.env.WOMPI_PRIVATE_KEY ?? '';
  private readonly integrityKey = process.env.WOMPI_INTEGRITY_KEY ?? '';

  private async getAcceptanceToken(): Promise<string> {
    const { data } = await axios.get(`${this.apiUrl}/merchants/${this.publicKey}`);
    return data.data.presigned_acceptance.acceptance_token;
  }

  private async tokenizeCard(card: CardData): Promise<string> {
    const { data } = await axios.post(
      `${this.apiUrl}/tokens/cards`,
      {
        number: card.number,
        cvc: card.cvc,
        exp_month: card.expMonth,
        exp_year: card.expYear,
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

    const integrity = this.buildIntegrityHash(params.reference, params.amountInCents);

    const { data } = await axios.post(
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
        signature: { integrity },
        acceptance_token: acceptanceToken,
      },
      { headers: { Authorization: `Bearer ${this.privateKey}` } },
    );

    const txn = data.data;
    return {
      wompiId: txn.id,
      status: txn.status as PaymentResult['status'],
      cardLastFour: txn.payment_method?.extra?.last_four ?? '****',
      cardBrand: txn.payment_method?.extra?.brand ?? 'UNKNOWN',
    };
  }
}
