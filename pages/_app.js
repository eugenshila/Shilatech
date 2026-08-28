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

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <StaffBoundary><Component {...pageProps} /></StaffBoundary>
    </CartProvider>
  );
}

