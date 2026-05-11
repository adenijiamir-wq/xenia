'use client';

import { products } from '@/lib/data/products';
import ProductCard from '@/components/products/ProductCard';
import { Sparkles } from 'lucide-react';

export default function FeaturedProducts() {
  const featured = products.filter((p) => p.type === 'good').slice(0, 8);

  return (
    <section className="container-custom py-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-scarlet-500 to-scarlet-600 p-3 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-charcoal-900">
              Featured Products
            </h2>
            <p className="text-charcoal-600">Handpicked for Rutgers students</p>
          </div>
        </div>
        <a
          href="/categories"
          className="text-scarlet-500 font-semibold hover:text-scarlet-600 transition-colors"
        >
          Browse All →
        </a>
      </div>

      <div className="product-grid">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
