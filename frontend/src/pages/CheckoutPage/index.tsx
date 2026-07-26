import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import StepCardDelivery from '../../components/StepCardDelivery';
import StepSummary from '../../components/StepSummary';
import StepResult from '../../components/StepResult';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { step, product } = useAppSelector((s) => s.checkout);

  useEffect(() => {
    if (!product) navigate('/', { replace: true });
  }, [product, navigate]);

  if (!product) return null;

  if (step === 2) return <StepCardDelivery />;
  if (step === 3) return <StepSummary />;
  if (step === 4) return <StepResult />;

  return null;
}
