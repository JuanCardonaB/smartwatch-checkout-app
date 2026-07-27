import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchProduct, setStep } from "../../store/slices/checkout.slice";

const SNAP_POINTS = [38, 58, 80];
const MIN_HEIGHT = 30;
const MAX_HEIGHT = 80;

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { product, loading, error } = useAppSelector((s) => s.checkout);

  const [activeImage, setActiveImage] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(SNAP_POINTS[0]);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(SNAP_POINTS[0]);
  const swipeStartX = useRef<number | null>(null);

  useEffect(() => {
    dispatch(fetchProduct());
  }, [dispatch]);

  function handleBuy() {
    dispatch(setStep(2));
    navigate("/checkout");
  }

  /* ── mobile sheet drag ── */
  function onSheetDragStart(clientY: number) {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
  }
  function onSheetDragMove(clientY: number) {
    if (dragStartY.current === null) return;
    const delta = ((dragStartY.current - clientY) / window.innerHeight) * 100;
    setSheetHeight(
      Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, dragStartHeight.current + delta),
      ),
    );
  }
  function onSheetDragEnd() {
    if (dragStartY.current === null) return;
    setIsDragging(false);
    dragStartY.current = null;
    const closest = SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - sheetHeight) < Math.abs(prev - sheetHeight) ? curr : prev,
    );
    setSheetHeight(closest);
  }

  /* ── swipe ── */
  function onSwipeStart(clientX: number) {
    swipeStartX.current = clientX;
  }
  function onSwipeEnd(clientX: number, total: number) {
    if (swipeStartX.current === null) return;
    const delta = swipeStartX.current - clientX;
    if (delta > 50) setActiveImage((p) => (p + 1) % total);
    else if (delta < -50) setActiveImage((p) => (p - 1 + total) % total);
    swipeStartX.current = null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error ?? "Product not available"}</p>
      </div>
    );
  }

  const fallback =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop";
  const images = product.imageUrls?.length ? product.imageUrls : [fallback];
  const current = Math.min(activeImage, images.length - 1);
  const price = `$${(product.priceInCents / 100).toLocaleString("es-CO")} COP`;

  return (
    <>
      {/* ══════════════════════════════════════════
          MOBILE layout (hidden on md+)
      ══════════════════════════════════════════ */}
      <div className="md:hidden relative h-screen w-full overflow-hidden">
        {/* image background + swipe */}
        <div
          className="fixed inset-0 select-none"
          onTouchStart={(e) => onSwipeStart(e.touches[0].clientX)}
          onTouchEnd={(e) =>
            onSwipeEnd(e.changedTouches[0].clientX, images.length)
          }
          onMouseDown={(e) => onSwipeStart(e.clientX)}
          onMouseUp={(e) => onSwipeEnd(e.clientX, images.length)}
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${product.name} ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          ))}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex gap-1 z-10"
            style={{ bottom: "42%" }}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                aria-label={`Slide ${i + 1}`}
                className="flex items-center justify-center min-h-6 min-w-6"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === current ? "bg-white w-5" : "bg-white/55 w-2"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* bottom sheet */}
        <div
          style={{ height: `${sheetHeight}vh` }}
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col ${
            isDragging ? "" : "transition-[height] duration-300 ease-out"
          }`}
        >
          <div
            className="flex justify-center pt-3 pb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => onSheetDragStart(e.clientY)}
            onMouseMove={(e) => e.buttons === 1 && onSheetDragMove(e.clientY)}
            onMouseUp={onSheetDragEnd}
            onMouseLeave={onSheetDragEnd}
            onTouchStart={(e) => onSheetDragStart(e.touches[0].clientY)}
            onTouchMove={(e) => onSheetDragMove(e.touches[0].clientY)}
            onTouchEnd={onSheetDragEnd}
          >
            <div className="h-1 w-10 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="shrink-0 border-t border-gray-100 px-6 pt-3 pb-6 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-gray-900">{price}</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                {product.stock} in stock
              </span>
            </div>
            <button
              onClick={handleBuy}
              disabled={product.stock === 0}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay with credit card
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP layout (hidden below md)
      ══════════════════════════════════════════ */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center p-8">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex">
          {/* ── Left: image carousel ── */}
          <div
            className="relative w-[55%] shrink-0 bg-gray-100 select-none overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => onSwipeStart(e.clientX)}
            onMouseUp={(e) => onSwipeEnd(e.clientX, images.length)}
          >
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${product.name} ${i + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
              />
            ))}

            {/* arrow prev */}
            {images.length > 1 && (
              <button
                onClick={() =>
                  setActiveImage((p) => (p - 1 + images.length) % images.length)
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
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
            )}

            {/* arrow next */}
            {images.length > 1 && (
              <button
                onClick={() => setActiveImage((p) => (p + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}

            {/* dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="flex items-center justify-center min-h-6 min-w-6"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      i === current ? "bg-white w-6" : "bg-white/50 w-2"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: product info ── */}
          <div className="flex-1 flex flex-col justify-between p-10 min-h-135">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Smartwatch
              </span>
              <h1 className="mt-3 text-4xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <p className="mt-5 text-gray-500 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  {price}
                </span>
                <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-semibold text-green-700">
                  {product.stock} in stock
                </span>
              </div>

              <button
                onClick={handleBuy}
                disabled={product.stock === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pay with credit card
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
