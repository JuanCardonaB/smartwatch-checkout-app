import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { setStep, setTransaction } from "../../store/slices/checkout.slice";
import type { TransactionResult } from "../../types";

const BASE_FEE = 300000;
const DELIVERY_FEE = 500000;

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("es-CO")} COP`;
}

function detectBrand(num: string): "visa" | "mastercard" | null {
  const n = (num ?? "").replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  return null;
}

function VisaChip({ className = "h-5 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 780 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="780" height="500" rx="40" fill="#1a1f71" />
      <text
        x="390"
        y="370"
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

function McChip({ className = "h-5 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 152 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="52" cy="50" r="48" fill="#EB001B" />
      <circle cx="100" cy="50" r="48" fill="#F79E1B" />
      <path
        d="M76 10.5C87.2 19 95 32.7 95 48s-7.8 29-19 37.5C64.8 77 57 63.3 57 48S64.8 19 76 10.5z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function LineItem({
  label,
  amount,
  muted = false,
}: {
  label: string;
  amount: number;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-gray-400" : "text-gray-700"}`}>
        {label}
      </span>
      <span
        className={`text-sm font-medium ${muted ? "text-gray-400" : "text-gray-700"}`}
      >
        {fmt(amount)}
      </span>
    </div>
  );
}

export default function StepSummary() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { product, card, customer, delivery } = useAppSelector(
    (s) => s.checkout,
  );

  if (!product || !card || !customer || !delivery) {
    dispatch(setStep(2));
    return null;
  }

  const productAmount = product.priceInCents;
  const total = productAmount + BASE_FEE + DELIVERY_FEE;
  const brand = detectBrand(card.number);
  const lastFour = card.number.replace(/\s/g, "").slice(-4);
  const fallback =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop";
  const heroImage = product.imageUrls?.[0] ?? fallback;

  function handleBack() {
    dispatch(setStep(2));
  }

  function handleConfirm() {
    // Mock — will be replaced with real Wompi call
    const mock: TransactionResult = {
      id: crypto.randomUUID(),
      reference: `REF-${Date.now()}`,
      wompiId: null,
      customerId: "mock-customer",
      productId: product!.id,
      productAmountInCents: productAmount,
      baseFeeInCents: BASE_FEE,
      deliveryFeeInCents: DELIVERY_FEE,
      amountInCents: total,
      status: "APPROVED",
      cardLastFour: lastFour,
      cardBrand: brand,
      deliveryId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch(setTransaction(mock));
    navigate("/checkout");
  }

  const stepDots = (dark = false) => (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`block rounded-full transition-all ${
            n === 2
              ? `h-2 w-5 ${dark ? "bg-white" : "bg-gray-900"}`
              : `h-2 w-2 ${dark ? "bg-white/30" : "bg-gray-300"}`
          }`}
        />
      ))}
    </div>
  );

  const cardBlock = (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">
        Charging to
      </p>
      <div className="flex items-center gap-3">
        {brand === "visa" && <VisaChip />}
        {brand === "mastercard" && <McChip />}
        {!brand && <div className="h-5 w-8 rounded bg-gray-300" />}
        <div>
          <p className="text-sm font-semibold text-gray-900">
            •••• •••• •••• {lastFour}
          </p>
          <p className="text-xs text-gray-400 capitalize">
            {brand ?? "card"} · expires {card.expMonth.padStart(2, "0")}/
            {card.expYear}
          </p>
        </div>
      </div>
    </div>
  );

  const deliveryBlock = (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-medium">
        Delivering to
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {delivery.recipientName}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
        {delivery.address}, {delivery.city}, {delivery.department}
      </p>
    </div>
  );

  const payButton = (
    <button
      onClick={handleConfirm}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-semibold text-white transition active:scale-95 hover:bg-gray-800"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      Confirm payment · {fmt(total)}
    </button>
  );

  return (
    <>
      {/* ══════════════════════════════════════════
          MOBILE layout — Material Design Backdrop
      ══════════════════════════════════════════ */}
      <div className="md:hidden fixed inset-0 flex flex-col overflow-hidden">
        {/* back layer */}
        <div className="relative shrink-0" style={{ height: "38%" }}>
          <img
            src={heroImage}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/10 to-black/60" />
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
            aria-label="Go back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="absolute top-5 right-4">{stepDots(true)}</div>
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-xs text-white/60 uppercase tracking-widest font-medium">
              Ordering
            </p>
            <h2 className="text-lg font-bold text-white leading-tight">
              {product.name}
            </h2>
          </div>
        </div>

        {/* front layer */}
        <div
          className="flex flex-1 flex-col rounded-t-3xl bg-white shadow-2xl overflow-hidden"
          style={{ marginTop: "-20px" }}
        >
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-32">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              Order Summary
            </h2>
            <div className="flex flex-col gap-3">
              <LineItem label={product.name} amount={productAmount} />
              <LineItem label="Base fee" amount={BASE_FEE} muted />
              <LineItem label="Delivery fee" amount={DELIVERY_FEE} muted />
            </div>
            <div className="my-4 border-t border-dashed border-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {fmt(total)}
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {cardBlock}
              {deliveryBlock}
            </div>
          </div>
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-6 pt-4">
            {payButton}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP layout
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex">
          {/* ── Left: product image ── */}
          <div className="relative w-[55%] shrink-0 bg-gray-100 min-h-145">
            <img
              src={heroImage}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/20" />

            {/* back button */}
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
              aria-label="Go back"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="absolute top-7 right-6">{stepDots(true)}</div>

            {/* product name overlay */}
            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-xs text-white/50 uppercase tracking-widest font-medium mb-1">
                Ordering
              </p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                {product.name}
              </h2>
              <p className="text-sm text-white/60 mt-1">{fmt(productAmount)}</p>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 mb-4">
                <LineItem label={product.name} amount={productAmount} />
                <LineItem label="Base fee" amount={BASE_FEE} muted />
                <LineItem label="Delivery fee" amount={DELIVERY_FEE} muted />
              </div>

              <div className="border-t border-dashed border-gray-200 my-4" />
              <div className="flex items-center justify-between mb-8">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {fmt(total)}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {cardBlock}
                {deliveryBlock}
              </div>
            </div>

            <div className="border-t border-gray-100 px-10 py-6">
              {payButton}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
