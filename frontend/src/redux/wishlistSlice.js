import { createSlice } from '@reduxjs/toolkit';

const getInitialWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  } catch (error) {
    console.error('Error loading wishlist from localStorage:', error);
    return [];
  }
};

const initialState = {
  items: getInitialWishlist(),
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.items.some((item) => item._id === product._id);
      if (exists) {
        state.items = state.items.filter((item) => item._id !== product._id);
      } else {
        state.items.push(product);
      }
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
      localStorage.setItem('wishlist', JSON.stringify(state.items));
    },
  },
});

export const { toggleWishlist, removeFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
