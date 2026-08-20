import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem('shilatech-cart') || '[]')); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('shilatech-cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const found = prev.find(x => x.id === product.id);
      return found
        ? prev.map(x => x.id === product.id ? { ...x, qty: x.qty + qty } : x)
        : [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = id => setCart(prev => prev.filter(x => x.id !== id));
  const setQty = (id, qty) => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, qty) } : x));
  const clearCart = () => setCart([]);
  const total = useMemo(() => cart.reduce((s, x) => s + x.price * x.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, x) => s + x.qty, 0), [cart]);

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, setQty, clearCart, total, count }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
