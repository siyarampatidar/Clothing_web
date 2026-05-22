import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for receiving/sending HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer token if present in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format error responses cleanly
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized (token expired, blacklisted, etc.)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // We can also trigger a window redirect or redux store reset if needed
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
