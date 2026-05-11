'use client';

import { products } from '@/lib/data/products';
import ProductCard from '@/components/products/ProductCard';
import { Flame } from 'lucide-react';

export default function TrendingDeals() {
  const deals = products.filter((p) => p.isDeal).slice(0, 5);

  return (
    <section className="bg-gradient-to-br from-scarlet-50 to-white py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-scarlet-500 p-3 rounded-xl">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-charcoal-900">
                Trending Deals
              </h2>
              <p className="text-charcoal-600">Save big on these hot items</p>
            </div>
          </div>
          <a
            href="/deals"
            className="text-scarlet-500 font-semibold hover:text-scarlet-600 transition-colors"
          >
            View All →
          </a>
        </div>

        <div className="product-grid">
          {deals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
