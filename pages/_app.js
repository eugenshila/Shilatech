import { Lora } from 'next/font/google';
import '../styles/globals.css';
import '../styles/home-premium.css';
import '../styles/warehouse.css';
import '../styles/warehouse-premium.css';
import '../styles/warehouse-receiving.css';
import '../styles/delivery.css';
import '../styles/workshop.css';
import '../styles/bold-home.css';
import '../styles/counter.css';
import { CartProvider } from '../components/CartContext';
import StaffBoundary from '../components/StaffBoundary';
import '../styles/staff.css';

const lora = Lora({ subsets: ['latin'], display: 'swap', preload: true });

export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        html, body { font-family: ${lora.style.fontFamily}; }
      `}</style>
    <CartProvider>
      <StaffBoundary><Component {...pageProps} /></StaffBoundary>
    </CartProvider>
    </>
  );
}

