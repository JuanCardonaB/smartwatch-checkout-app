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
    if (!product) dispatch(fetchProduct());
  }, [dispatch, product]);

  function handleBuy() {
    dispatch(setStep(2));
    navigate("/checkout");
  }

  function onSheetDragStart(clientY: number) {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
  }

  function onSheetDragMove(clientY: number) {
    if (dragStartY.current === null) return;
    const deltaPercent =
      ((dragStartY.current - clientY) / window.innerHeight) * 100;
    const next = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, dragStartHeight.current + deltaPercent),
    );
    setSheetHeight(next);
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

  const fallbackImage =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&fit=crop";
  const imageUrl = product.imageUrl || fallbackImage;
  const images = [imageUrl, imageUrl, imageUrl];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Fixed image background with horizontal swipe */}
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
              i === activeImage ? "opacity-100" : "opacity-0"
            }`}
            draggable={false}
          />
        ))}

        {/* Dots above the sheet */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex gap-2 z-10"
          style={{ bottom: "42%" }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeImage ? "bg-white w-5" : "bg-white/55 w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div
        style={{ height: `${sheetHeight}vh` }}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col ${
          isDragging ? "" : "transition-[height] duration-300 ease-out"
        }`}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
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

        {/* Scrollable product info */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Fixed bottom: price + CTA */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 pt-3 pb-6 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-gray-900">
              ${(product.priceInCents / 100).toLocaleString("es-CO")} COP
            </span>
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
  );
}
