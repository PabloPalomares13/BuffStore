import { useState, useEffect } from "react";
import { getFeaturedProducts } from "../services/productService";

export function useFeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFeaturedProducts()
      .then(setProducts)
      .catch((err) => {
        console.error(err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { products, loading, error };
}