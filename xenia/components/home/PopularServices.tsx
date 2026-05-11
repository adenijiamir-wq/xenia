'use client';

import { products } from '@/lib/data/products';
import ProductCard from '@/components/products/ProductCard';
import { Briefcase } from 'lucide-react';

export default function PopularServices() {
  const services = products.filter((p) => p.type === 'service');

  return (
    <section className="bg-charcoal-50 py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-charcoal-900 p-3 rounded-xl">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-charcoal-900">
                Popular Services
              </h2>
              <p className="text-charcoal-600">Book services from verified providers</p>
            </div>
          </div>
          <a
            href="/categories/services"
            className="text-scarlet-500 font-semibold hover:text-scarlet-600 transition-colors"
          >
            All Services →
          </a>
        </div>

        <div className="product-grid">
          {services.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
