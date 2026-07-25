import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import StepCardDelivery from '../../components/StepCardDelivery';
import StepSummary from '../../components/StepSummary';
import StepResult from '../../components/StepResult';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { step, product } = useAppSelector((s) => s.checkout);

  // Guard: if no product loaded, send back to product page
  useEffect(() => {
    if (!product) navigate('/', { replace: true });
  }, [product, navigate]);

  if (!product) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8">
      {step === 2 && <StepCardDelivery />}
      {step === 3 && <StepSummary />}
      {step === 4 && <StepResult />}
    </div>
  );
}
