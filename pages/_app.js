import '../styles/globals.css';
import '../styles/home-premium.css';
import '../styles/warehouse.css';
import '../styles/warehouse-premium.css';
import '../styles/delivery.css';
import { CartProvider } from '../components/CartContext';

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
