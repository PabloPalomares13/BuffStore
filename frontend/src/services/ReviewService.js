import axios from 'axios';

const API = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/reviews`
  : 'http://localhost:3000/api/reviews';

const authHeaders = () => {
  const token = localStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getReviews = (productId, { page = 1, limit = 10 } = {}) =>
  axios
    .get(`${API}/product/${productId}`, { params: { page, limit }, headers: authHeaders() })
    .then((res) => res.data);

export const createReview = (productId, { rating, text }) =>
  axios
    .post(`${API}/product/${productId}`, { rating, text }, { headers: authHeaders() })
    .then((res) => res.data);

export const updateReview = (reviewId, { rating, text }) =>
  axios
    .put(`${API}/${reviewId}`, { rating, text }, { headers: authHeaders() })
    .then((res) => res.data);

export const deleteReview = (reviewId) =>
  axios
    .delete(`${API}/${reviewId}`, { headers: authHeaders() })
    .then((res) => res.data);