export interface CardData {
  number: string;
  holder: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

export interface PaymentResult {
  wompiId: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  cardLastFour: string;
  cardBrand: string;
}

export abstract class PaymentGatewayPort {
  abstract processPayment(params: {
    reference: string;
    amountInCents: number;
    card: CardData;
    customerEmail: string;
  }): Promise<PaymentResult>;
}
