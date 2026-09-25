import axios from 'axios';
 
const API = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/store-feedback`
  : 'http://localhost:3000/api/store-feedback';
 
const authHeaders = () => {
  const token = localStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
 
// ¿Puede el usuario calificar la compra de este juego? ¿Ya envió su opinión?
export const getMyStoreFeedback = (productId) =>
  axios
    .get(`${API}/product/${productId}`, { headers: authHeaders() })
    .then((res) => res.data);
 
// Crea o edita la opinión de una orden: { ratings: { purchaseEase, deliverySpeed, paymentTrust }, comment }
export const saveStoreFeedback = (orderId, { ratings, comment }) =>
  axios
    .put(`${API}/order/${orderId}`, { ratings, comment }, { headers: authHeaders() })
    .then((res) => res.data);