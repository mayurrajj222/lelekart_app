import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import axiosClient from '@/lib/axiosClient';
import { ProductCard } from '@/components/ui/product-card';

export default function UnderPriceProductsPage() {
  const [location] = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const price = parseInt(location.split('/').pop() || '0', 10);

  useEffect(() => {
    setLoading(true);
    // Fetch all pages of products
    const fetchAllProducts = async () => {
      let allProducts: any[] = [];
      let page = 1;
      let keepGoing = true;
      while (keepGoing) {
        const res = await axiosClient.get('/api/products', { params: { page, limit: 50 } });
        const pageProducts = res.data || [];
        allProducts = allProducts.concat(pageProducts);
        if (pageProducts.length < 50) {
          keepGoing = false;
        } else {
          page++;
        }
      }
      setProducts(allProducts.filter((p: any) => p.price < price));
      setLoading(false);
    };
    fetchAllProducts().catch(() => {
      setProducts([]);
      setLoading(false);
    });
  }, [price]);

  return (
    <div className="min-h-screen bg-[#F8F5E4] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">All Products Under ₹{price}</h1>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">No products found under ₹{price}.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} showAddToCart={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 