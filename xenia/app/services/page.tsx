'use client';

import ProductCard from '@/components/products/ProductCard';
import { products } from '@/lib/data/products';

export default function ServicesPage() {
  const services = products.filter(p => p.type === 'service');

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">Book Services</h1>
          <p className="text-charcoal-600">Hire trusted help instantly</p>
        </div>

        <div className="product-grid">
          {services.map((service) => (
            <ProductCard key={service.id} product={service} />
          ))}
        </div>
      </div>
    </div>
  );
}
