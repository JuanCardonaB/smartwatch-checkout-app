import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { resetCheckout } from '../../store/slices/checkout.slice';

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('es-CO')} COP`;
}

function ApprovedIcon() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
      <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function DeclinedIcon() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
      <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function PendingIcon() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

const STATUS_CONFIG = {
  APPROVED: {
    icon: <ApprovedIcon />,
    headline: 'Payment successful!',
    sub: 'Your order is confirmed and will be delivered soon.',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    btnClass: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
  PENDING: {
    icon: <PendingIcon />,
    headline: 'Payment pending',
    sub: 'Your payment is being processed. We\'ll notify you when confirmed.',
    badgeClass: 'bg-amber-100 text-amber-700',
    btnClass: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
  DECLINED: {
    icon: <DeclinedIcon />,
    headline: 'Payment declined',
    sub: 'Your card was declined. Please check your details and try again.',
    badgeClass: 'bg-red-100 text-red-700',
    btnClass: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
  VOIDED: {
    icon: <DeclinedIcon />,
    headline: 'Payment voided',
    sub: 'This transaction was voided.',
    badgeClass: 'bg-gray-100 text-gray-600',
    btnClass: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
  ERROR: {
    icon: <DeclinedIcon />,
    headline: 'Something went wrong',
    sub: 'An error occurred while processing your payment. Please try again.',
    badgeClass: 'bg-red-100 text-red-700',
    btnClass: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
} as const;

export default function StepResult() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { transaction, product } = useAppSelector((s) => s.checkout);

  const status = transaction?.status ?? 'ERROR';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ERROR;
  const isSuccess = status === 'APPROVED';

  function handleFinish() {
    dispatch(resetCheckout());
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* top accent bar */}
      <div
        className={`h-1 w-full ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}
      />

      <div className="flex flex-1 flex-col items-center justify-between px-6 py-10">

        {/* ── top: icon + message ── */}
        <div className="flex flex-1 flex-col items-center justify-center text-center gap-5">
          {cfg.icon}

          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-gray-900">{cfg.headline}</h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{cfg.sub}</p>
          </div>

          {/* status badge */}
          <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${cfg.badgeClass}`}>
            {status}
          </span>
        </div>

        {/* ── receipt card ── */}
        {transaction && (
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-8">
            {/* dotted top edge */}
            <div className="flex gap-1 justify-center mb-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-0.5 w-1.5 rounded-full bg-gray-200" />
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {product && (
                <ReceiptRow label="Product" value={product.name} />
              )}
              <ReceiptRow
                label="Reference"
                value={transaction.reference}
                mono
              />
              {transaction.cardLastFour && (
                <ReceiptRow
                  label="Card"
                  value={`${transaction.cardBrand ?? ''} •••• ${transaction.cardLastFour}`.trim()}
                />
              )}
              <ReceiptRow
                label="Product"
                value={fmt(transaction.productAmountInCents)}
              />
              <ReceiptRow
                label="Base fee"
                value={fmt(transaction.baseFeeInCents)}
                muted
              />
              <ReceiptRow
                label="Delivery fee"
                value={fmt(transaction.deliveryFeeInCents)}
                muted
              />

              {/* total */}
              <div className="mt-1 border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">
                  {fmt(transaction.amountInCents)}
                </span>
              </div>
            </div>

            {/* dotted bottom edge */}
            <div className="flex gap-1 justify-center mt-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-0.5 w-1.5 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="w-full max-w-sm">
          <button
            onClick={handleFinish}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition active:scale-95 ${cfg.btnClass}`}
          >
            {isSuccess ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Back to store
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try again
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  muted = false,
  mono = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-xs font-medium text-right truncate max-w-[180px] ${muted ? 'text-gray-400' : 'text-gray-700'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
