 
const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000';

export async function getFeaturedProducts() {
  const res = await fetch(`${link}/api/products/featured`);
  if (!res.ok) throw new Error("Error al obtener productos destacados");
  return res.json();
}