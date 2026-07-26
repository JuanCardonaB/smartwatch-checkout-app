import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setStep,
  setCustomer,
  setCard,
  setDelivery,
} from '../../store/slices/checkout.slice';
import type { CustomerForm, CardForm, DeliveryForm } from '../../types';

/* ─── card brand helpers ──────────────────────────────────────── */

type CardBrand = 'visa' | 'mastercard' | null;

function detectBrand(num: string): CardBrand {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7]\d{2})/.test(n)) return 'mastercard';
  return null;
}

function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})(?=.)/g, '$1 ');
}

function maskCardDisplay(formatted: string): string {
  const digits = formatted.replace(/\s/g, '');
  if (digits.length === 0) return '•••• •••• •••• ••••';
  const padded = digits.padEnd(16, '•');
  return `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12)}`;
}

/* ─── small brand SVGs ────────────────────────────────────────── */

function VisaSvg({ className = 'h-7 w-11' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#1a1f71" />
      <text
        x="390" y="370"
        textAnchor="middle"
        fill="white"
        fontSize="290"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardSvg({ className = 'h-7 w-11' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 152 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="50" r="48" fill="#EB001B" />
      <circle cx="100" cy="50" r="48" fill="#F79E1B" />
      <path
        d="M76 10.5C87.2 19 95 32.7 95 48s-7.8 29-19 37.5C64.8 77 57 63.3 57 48S64.8 19 76 10.5z"
        fill="#FF5F00"
      />
    </svg>
  );
}

/* ─── field component ─────────────────────────────────────────── */

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10';

/* ─── main component ──────────────────────────────────────────── */

export default function StepCardDelivery() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const saved = useAppSelector((s) => s.checkout);
  const uid = useId();

  /* form state */
  const [customer, setLocalCustomer] = useState<CustomerForm>({
    name: saved.customer?.name ?? '',
    email: saved.customer?.email ?? '',
    phone: saved.customer?.phone ?? '',
  });

  const [card, setLocalCard] = useState<CardForm>({
    number: saved.card?.number ?? '',
    holder: saved.card?.holder ?? '',
    expMonth: saved.card?.expMonth ?? '',
    expYear: saved.card?.expYear ?? '',
    cvc: saved.card?.cvc ?? '',
  });

  const [delivery, setLocalDelivery] = useState<DeliveryForm>({
    recipientName: saved.delivery?.recipientName ?? '',
    phone: saved.delivery?.phone ?? '',
    address: saved.delivery?.address ?? '',
    city: saved.delivery?.city ?? '',
    department: saved.delivery?.department ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState(false);

  const brand = detectBrand(card.number);

  /* ── validation ── */
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!customer.name.trim()) e.custName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      e.custEmail = 'Enter a valid email';
    if (!customer.phone.replace(/\D/g, ''))
      e.custPhone = 'Required';

    const rawCard = card.number.replace(/\s/g, '');
    if (rawCard.length !== 16) e.cardNumber = 'Must be 16 digits';
    if (!brand) e.cardBrand = 'Only VISA and Mastercard accepted';
    if (!card.holder.trim()) e.cardHolder = 'Required';
    const month = parseInt(card.expMonth, 10);
    if (!card.expMonth || month < 1 || month > 12) e.expMonth = 'Invalid (01–12)';
    const year = parseInt(card.expYear, 10);
    const thisYear = new Date().getFullYear() % 100;
    if (!card.expYear || year < thisYear) e.expYear = 'Invalid year';
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = '3–4 digits';

    if (!delivery.recipientName.trim()) e.delName = 'Required';
    if (!delivery.phone.trim()) e.delPhone = 'Required';
    if (!delivery.address.trim()) e.delAddress = 'Required';
    if (!delivery.city.trim()) e.delCity = 'Required';
    if (!delivery.department.trim()) e.delDept = 'Required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    dispatch(setCustomer(customer));
    dispatch(setCard(card));
    dispatch(setDelivery(delivery));
    dispatch(setStep(3));
  }

  function handleBack() {
    dispatch(setStep(1));
    navigate('/', { replace: true });
  }

  /* ─── card preview widget ─── */
  const displayNumber = maskCardDisplay(card.number);
  const displayHolder = card.holder.trim() || 'FULL NAME';
  const displayExp =
    card.expMonth && card.expYear
      ? `${card.expMonth.padStart(2, '0')}/${card.expYear.slice(-2)}`
      : 'MM/YY';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-4 border-b border-gray-100">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700"
          aria-label="Go back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="flex-1 text-base font-semibold text-gray-900">Payment</h1>

        {/* step dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`block rounded-full transition-all ${
                n === 1 ? 'h-2 w-5 bg-gray-900' : 'h-2 w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">

        {/* ─── CARD PREVIEW ─── */}
        <div className="mt-6 mb-6 flex justify-center" style={{ perspective: '1000px' }}>
          <div
            className="relative cursor-pointer"
            style={{
              width: '320px',
              height: '190px',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={() => setFlipped((f) => !f)}
          >
            {/* front face */}
            <div
              className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-lg"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              }}
            >
              <div className="flex items-start justify-between">
                {/* chip */}
                <div className="h-8 w-11 rounded-md bg-yellow-300/80 border border-yellow-400/60 flex items-center justify-center">
                  <div className="h-5 w-8 rounded-sm bg-yellow-200/60 border border-yellow-300/60" />
                </div>
                {/* brand */}
                {brand === 'visa' && <VisaSvg />}
                {brand === 'mastercard' && <MastercardSvg />}
                {!brand && (
                  <div className="h-7 w-11 rounded border border-white/20 flex items-center justify-center">
                    <span className="text-white/30 text-xs font-mono">?</span>
                  </div>
                )}
              </div>
              <div>
                <p className="font-mono text-lg tracking-widest text-white/90">{displayNumber}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Cardholder</p>
                    <p className="text-sm font-semibold text-white uppercase tracking-widest truncate max-w-[160px]">
                      {displayHolder}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Expires</p>
                    <p className="text-sm font-semibold text-white font-mono">{displayExp}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* back face */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col justify-center shadow-lg overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              }}
            >
              <div className="mt-4 h-10 bg-gray-900/70 w-full" />
              <div className="mt-4 mx-5 flex items-center justify-end rounded bg-white/10 px-3 py-2">
                <p className="font-mono text-white/80 text-sm tracking-widest">
                  {card.cvc || '•••'}
                </p>
              </div>
              <p className="mt-3 text-center text-xs text-white/30">CVC</p>
            </div>
          </div>
        </div>

        {/* ─── CUSTOMER INFO ─── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Personal Info
          </h2>
          <div className="flex flex-col gap-3">
            <Field label="Full name" error={errors.custName}>
              <input
                id={`${uid}-cust-name`}
                className={inputCls}
                placeholder="John Doe"
                value={customer.name}
                onChange={(e) => setLocalCustomer((p) => ({ ...p, name: e.target.value }))}
              />
            </Field>
            <Field label="Email" error={errors.custEmail}>
              <input
                id={`${uid}-cust-email`}
                type="email"
                className={inputCls}
                placeholder="john@example.com"
                value={customer.email}
                onChange={(e) => setLocalCustomer((p) => ({ ...p, email: e.target.value }))}
              />
            </Field>
            <Field label="Phone" error={errors.custPhone}>
              <input
                id={`${uid}-cust-phone`}
                type="tel"
                className={inputCls}
                placeholder="+57 300 000 0000"
                value={customer.phone}
                onChange={(e) => setLocalCustomer((p) => ({ ...p, phone: e.target.value }))}
              />
            </Field>
          </div>
        </section>

        {/* ─── CARD INFO ─── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Card Information
          </h2>
          <div className="flex flex-col gap-3">
            <Field label="Card number" error={errors.cardNumber || errors.cardBrand}>
              <div className="relative">
                <input
                  id={`${uid}-card-number`}
                  className={`${inputCls} pr-14`}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  value={card.number}
                  onChange={(e) =>
                    setLocalCard((p) => ({
                      ...p,
                      number: formatCardNumber(e.target.value),
                    }))
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {brand === 'visa' && <VisaSvg className="h-5 w-8" />}
                  {brand === 'mastercard' && <MastercardSvg className="h-5 w-8" />}
                </span>
              </div>
            </Field>

            <Field label="Cardholder name" error={errors.cardHolder}>
              <input
                id={`${uid}-card-holder`}
                className={inputCls}
                placeholder="As it appears on card"
                value={card.holder}
                onChange={(e) =>
                  setLocalCard((p) => ({ ...p, holder: e.target.value.toUpperCase() }))
                }
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Month" error={errors.expMonth}>
                <input
                  id={`${uid}-exp-month`}
                  className={inputCls}
                  placeholder="MM"
                  inputMode="numeric"
                  maxLength={2}
                  value={card.expMonth}
                  onChange={(e) =>
                    setLocalCard((p) => ({
                      ...p,
                      expMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                    }))
                  }
                />
              </Field>
              <Field label="Year" error={errors.expYear}>
                <input
                  id={`${uid}-exp-year`}
                  className={inputCls}
                  placeholder="YY"
                  inputMode="numeric"
                  maxLength={2}
                  value={card.expYear}
                  onChange={(e) =>
                    setLocalCard((p) => ({
                      ...p,
                      expYear: e.target.value.replace(/\D/g, '').slice(0, 2),
                    }))
                  }
                />
              </Field>
              <Field label="CVC" error={errors.cvc}>
                <input
                  id={`${uid}-cvc`}
                  className={inputCls}
                  placeholder="•••"
                  inputMode="numeric"
                  maxLength={4}
                  value={card.cvc}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  onChange={(e) =>
                    setLocalCard((p) => ({
                      ...p,
                      cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                />
              </Field>
            </div>
          </div>
        </section>

        {/* ─── DELIVERY INFO ─── */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Delivery Information
          </h2>
          <div className="flex flex-col gap-3">
            <Field label="Recipient name" error={errors.delName}>
              <input
                id={`${uid}-del-name`}
                className={inputCls}
                placeholder="Who receives the package"
                value={delivery.recipientName}
                onChange={(e) =>
                  setLocalDelivery((p) => ({ ...p, recipientName: e.target.value }))
                }
              />
            </Field>
            <Field label="Contact phone" error={errors.delPhone}>
              <input
                id={`${uid}-del-phone`}
                type="tel"
                className={inputCls}
                placeholder="+57 310 000 0000"
                value={delivery.phone}
                onChange={(e) =>
                  setLocalDelivery((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </Field>
            <Field label="Street address" error={errors.delAddress}>
              <input
                id={`${uid}-del-address`}
                className={inputCls}
                placeholder="Calle 123 # 45-67"
                value={delivery.address}
                onChange={(e) =>
                  setLocalDelivery((p) => ({ ...p, address: e.target.value }))
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.delCity}>
                <input
                  id={`${uid}-del-city`}
                  className={inputCls}
                  placeholder="Bogotá"
                  value={delivery.city}
                  onChange={(e) =>
                    setLocalDelivery((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </Field>
              <Field label="Department" error={errors.delDept}>
                <input
                  id={`${uid}-del-dept`}
                  className={inputCls}
                  placeholder="Cundinamarca"
                  value={delivery.department}
                  onChange={(e) =>
                    setLocalDelivery((p) => ({ ...p, department: e.target.value }))
                  }
                />
              </Field>
            </div>
          </div>
        </section>
      </div>

      {/* ── sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 pb-safe pb-6 pt-4">
        <button
          onClick={handleSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-semibold text-white transition active:scale-95 hover:bg-gray-800"
        >
          Review order
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
