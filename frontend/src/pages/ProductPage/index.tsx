import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchProduct, setStep } from '../../store/slices/checkout.slice';

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { product, loading, error } = useAppSelector((s) => s.checkout);

  useEffect(() => {
    if (!product) dispatch(fetchProduct());
  }, [dispatch, product]);

  function handleBuy() {
    dispatch(setStep(2));
    navigate('/checkout');
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
        <p className="text-red-500">{error ?? 'Product not available'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-64 w-full object-cover"
        />
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{product.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              ${(product.priceInCents / 100).toLocaleString('es-CO')} COP
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
