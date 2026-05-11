'use client';

import Link from 'next/link';
import { Star, MapPin, Heart } from 'lucide-react';
import { Product } from '@/lib/data/products';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="product-card group">
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-charcoal-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isDeal && (
            <span className="badge-deal text-xs font-bold px-2 py-1">
              {discount}% OFF
            </span>
          )}
          {product.isNew && (
            <span className="badge-new text-xs font-bold px-2 py-1">
              NEW
            </span>
          )}
          {product.type === 'service' && (
            <span className="badge-service text-xs font-bold px-2 py-1">
              SERVICE
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-scarlet-500 text-scarlet-500' : 'text-charcoal-600'}`}
          />
        </button>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Category */}
        <p className="text-xs font-semibold text-scarlet-500 uppercase tracking-wide">
          {product.category}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-charcoal-900 line-clamp-2 group-hover:text-scarlet-500 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-charcoal-900">
              {product.rating}
            </span>
          </div>
          <span className="text-sm text-charcoal-500">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-charcoal-900">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-charcoal-500 line-through">
              ${product.originalPrice}
            </span>
          )}
          {product.type === 'service' && (
            <span className="text-sm text-charcoal-600">/hr</span>
          )}
        </div>

        {/* Seller & Location */}
        <div className="pt-2 border-t border-charcoal-100">
          <p className="text-sm text-charcoal-600">
            By <span className="font-medium text-scarlet-500">{product.seller}</span>
          </p>
          <div className="flex items-center gap-1 text-xs text-charcoal-500 mt-1">
            <MapPin className="w-3 h-3" />
            <span>{product.location}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
