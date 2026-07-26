import type { Transaction, Customer, Delivery } from "../types";

interface Props {
  transaction: Transaction;
  customer: Customer | undefined;
  delivery: Delivery | undefined;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  DECLINED: "bg-red-100 text-red-700",
  VOIDED: "bg-gray-100 text-gray-500",
  ERROR: "bg-red-100 text-red-700",
};

const DELIVERY_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("es-CO")} COP`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 px-4">
        {children}
      </div>
    </div>
  );
}

export default function OrderDetailModal({ transaction: txn, customer, delivery, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="font-mono text-xs text-gray-400">{txn.reference}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[txn.status] ?? "bg-gray-100 text-gray-500"}`}
            >
              {txn.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Transacción */}
          <Section title="Transacción">
            <Row label="Total" value={fmt(txn.amountInCents)} />
            <Row label="Producto" value={fmt(txn.productAmountInCents)} />
            <Row label="Fee base" value={fmt(txn.baseFeeInCents)} />
            <Row label="Fee envío" value={fmt(txn.deliveryFeeInCents)} />
            <Row
              label="Tarjeta"
              value={
                txn.cardBrand && txn.cardLastFour
                  ? `${txn.cardBrand} •••• ${txn.cardLastFour}`
                  : "—"
              }
            />
            {txn.wompiId && (
              <Row label="Wompi ID" value={<span className="font-mono text-xs">{txn.wompiId}</span>} />
            )}
            <Row label="Fecha" value={fmtDate(txn.createdAt)} />
          </Section>

          {/* Cliente */}
          <Section title="Cliente">
            {customer ? (
              <>
                <Row label="Nombre" value={customer.name} />
                <Row label="Email" value={customer.email} />
                <Row label="Teléfono" value={customer.phone} />
              </>
            ) : (
              <p className="py-3 text-sm text-gray-400">Sin información del cliente.</p>
            )}
          </Section>

          {/* Entrega */}
          <Section title="Entrega">
            {delivery ? (
              <>
                <Row
                  label="Estado"
                  value={
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DELIVERY_STATUS_STYLES[delivery.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {delivery.status}
                    </span>
                  }
                />
                <Row label="Destinatario" value={delivery.recipientName} />
                <Row label="Teléfono" value={delivery.phone} />
                <Row label="Dirección" value={delivery.address} />
                <Row label="Ciudad" value={`${delivery.city}, ${delivery.department}`} />
              </>
            ) : (
              <p className="py-3 text-sm text-gray-400">Sin entrega registrada.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
