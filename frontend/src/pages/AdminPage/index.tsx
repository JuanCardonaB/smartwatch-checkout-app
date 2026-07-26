import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchProduct,
  fetchOrders,
  updateProduct,
  clearAdminError,
} from "../../store/slices/admin.slice";
import type { ProductInput } from "../../services/api";
import type { Transaction, Customer, Delivery } from "../../types";
import ProductFormModal from "../../components/ProductFormModal";
import OrderDetailModal from "../../components/OrderDetailModal";

type Tab = "producto" | "ordenes";

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  DECLINED: "bg-red-100 text-red-700",
  VOIDED: "bg-gray-100 text-gray-500",
  ERROR: "bg-red-100 text-red-700",
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("es-CO")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { product, loading, saving, error, orders } = useAppSelector(
    (s) => s.admin,
  );

  const [tab, setTab] = useState<Tab>("producto");
  const [editingProduct, setEditingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{
    transaction: Transaction;
    customer: Customer | undefined;
    delivery: Delivery | undefined;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchProduct());
    dispatch(fetchOrders());
  }, [dispatch]);

  async function handleProductSubmit(data: ProductInput) {
    if (!product) return;
    const result = await dispatch(updateProduct({ id: product.id, data }));
    if (updateProduct.fulfilled.match(result)) setEditingProduct(false);
  }

  function openOrder(transaction: Transaction) {
    const customer = orders.customers.find(
      (c) => c.id === transaction.customerId,
    );
    const delivery = orders.deliveries.find(
      (d) => d.transactionId === transaction.id,
    );
    setSelectedOrder({ transaction, customer, delivery });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-700">
              ← Volver a la tienda
            </Link>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["producto", "ordenes"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                  tab === t
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "ordenes"
                  ? `Órdenes${orders.transactions.length ? ` (${orders.transactions.length})` : ""}`
                  : "Producto"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ── PRODUCTO TAB ── */}
        {tab === "producto" && (
          <>
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
            {loading ? (
              <p className="py-12 text-center text-gray-500">
                Cargando producto...
              </p>
            ) : !product ? (
              <p className="py-12 text-center text-gray-500">
                No hay producto disponible.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-4">
                  {product.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${product.name} ${i + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
                <div className="border-t border-gray-100 p-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {product.description}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-400">Precio</dt>
                      <dd className="font-semibold text-gray-900">
                        {fmt(product.priceInCents)} COP
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Stock</dt>
                      <dd className="font-semibold text-gray-900">
                        {product.stock}
                      </dd>
                    </div>
                  </dl>
                  <button
                    onClick={() => {
                      dispatch(clearAdminError());
                      setEditingProduct(true);
                    }}
                    className="mt-5 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                  >
                    Editar producto
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ÓRDENES TAB ── */}
        {tab === "ordenes" && (
          <>
            {orders.error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {orders.error}
              </p>
            )}
            {orders.loading ? (
              <p className="py-12 text-center text-gray-500">
                Cargando órdenes...
              </p>
            ) : orders.transactions.length === 0 ? (
              <p className="py-12 text-center text-gray-500">
                Aún no hay órdenes.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Referencia</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.transactions.map((txn) => {
                      const customer = orders.customers.find(
                        (c) => c.id === txn.customerId,
                      );
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {txn.reference}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[txn.status] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {customer?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {fmt(txn.amountInCents)}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {fmtDate(txn.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openOrder(txn)}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product edit modal */}
      {editingProduct && product && (
        <ProductFormModal
          product={product}
          saving={saving}
          onCancel={() => setEditingProduct(false)}
          onSubmit={handleProductSubmit}
        />
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          transaction={selectedOrder.transaction}
          customer={selectedOrder.customer}
          delivery={selectedOrder.delivery}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
