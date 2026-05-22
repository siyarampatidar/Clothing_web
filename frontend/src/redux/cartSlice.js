import { createSlice } from '@reduxjs/toolkit';

const getInitialCart = () => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

const initialState = {
  items: getInitialCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, size, color, quantity = 1 } = action.payload;
      const itemId = product._id;
      const itemSize = size || 'Standard';
      const itemColor = color || 'Standard';

      const existingIndex = state.items.findIndex(
        (item) => item.id === itemId && item.size === itemSize && item.color === itemColor
      );

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          id: itemId,
          name: product.productName,
          category: product.category?.categoryName || 'Boutique',
          price: product.discountPrice || product.price,
          originalPrice: product.price,
          size: itemSize,
          color: itemColor,
          quantity: quantity,
          image: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=500&q=80',
          stockQuantity: product.stockQuantity,
        });
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      const { id, size, color } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.id === id && item.size === size && (!color || item.color === color))
      );
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { id, size, color, quantity } = action.payload;
      const item = state.items.find(
        (item) => item.id === id && item.size === size && (!color || item.color === color)
      );
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.setItem('cart', JSON.stringify([]));
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
