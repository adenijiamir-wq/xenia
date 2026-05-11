'use client';

import { useState } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { products } from '@/lib/data/products';
import { Filter } from 'lucide-react';

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  
  const filteredProducts = products.filter(p => 
    filter === 'all' ? p.type === 'good' : p.category.toLowerCase() === filter
  );

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-900 mb-2">All Products</h1>
          <p className="text-charcoal-600">Browse everything available</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex items-center gap-4 overflow-x-auto pb-2">
          <button className="flex items-center gap-2 text-charcoal-700">
            <Filter className="w-5 h-5" />
            Filters
          </button>
          
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'all'
                ? 'bg-scarlet-500 text-white'
                : 'bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => setFilter('electronics')}
            className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
              filter === 'electronics'
                ? 'bg-scarlet-500 text-white'
                : 'bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200'
            }`}
          >
            Electronics
          </button>
          
          <button
            onClick={() => setFilter('furniture')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'furniture'
                ? 'bg-scarlet-500 text-white'
                : 'bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200'
            }`}
          >
            Furniture
          </button>
          
          <button
            onClick={() => setFilter('fashion')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === 'fashion'
                ? 'bg-scarlet-500 text-white'
                : 'bg-charcoal-100 text-charcoal-700 hover:bg-charcoal-200'
            }`}
          >
            Fashion
          </button>
        </div>

        {/* Results */}
        <div className="mb-4 text-charcoal-600">
          {filteredProducts.length} items found
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
