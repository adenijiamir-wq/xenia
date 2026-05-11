'use client';

import ProductCard from '@/components/products/ProductCard';
import { Truck } from 'lucide-react';

export default function DeliveryPage() {
  const deliveryItems = [
  {
    id: 'del-1',
    name: 'Pizza Express',
    description: 'Hot pizza in 30 mins',
    price: 8,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    category: 'Food Delivery',
    rating: 4.8,
    reviewCount: 234,
    reviews: [],
    location: { lat: 0, lng: 0 },
    seller: { name: 'Quick Eats', id: 'seller-1' },
    type: 'service' as const,
    distance: '1.0 km',
  },
];
    {
      id: 'del-2',
      name: 'Burger Joint',
      description: 'Best burgers on campus',
      price: 8,
      image: '/images/placeholder.jpg',
      category: 'Food Delivery',
      rating: 4.9,
      reviewCount: 412,
      seller: { name: 'Burger Spot', id: 'seller-2' },
      type: 'service' as const,
      distance: '0.6 km',
    },
    {
      id: 'del-3',
      name: 'Sushi Express',
      description: 'Fresh sushi delivered fast',
      price: 10,
      image: '/images/placeholder.jpg',
      category: 'Food Delivery',
      rating: 4.7,
      reviewCount: 298,
      seller: { name: 'Sushi House', id: 'seller-3' },
      type: 'service' as const,
      distance: '1.3 km',
    },
  ];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-10 h-10 text-scarlet-500" />
            <h1 className="text-4xl font-bold text-charcoal-900">Food Delivery</h1>
          </div>
          <p className="text-charcoal-600">Get food delivered fast</p>
        </div>

        {/* Info Banner */}
        <div className="bg-scarlet-50 border-l-4 border-scarlet-500 p-4 mb-8">
          <p className="text-charcoal-700">
            <strong>Fast Delivery:</strong> Most orders arrive within 30-45 minutes
          </p>
        </div>

        {/* Delivery Grid */}
        <div className="product-grid">
          {deliveryItems.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
