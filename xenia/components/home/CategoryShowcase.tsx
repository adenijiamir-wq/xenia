'use client';

import Link from 'next/link';
import { BookOpen, Laptop, Sofa, GraduationCap, UtensilsCrossed, Wrench } from 'lucide-react';

const categories = [
  {
    name: 'Textbooks',
    href: '/categories/textbooks',
    icon: BookOpen,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    count: '500+ listings',
    color: 'bg-blue-500',
  },
  {
    name: 'Electronics',
    href: '/categories/electronics',
    icon: Laptop,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    count: '300+ listings',
    color: 'bg-purple-500',
  },
  {
    name: 'Furniture',
    href: '/categories/furniture',
    icon: Sofa,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    count: '200+ listings',
    color: 'bg-green-500',
  },
  {
    name: 'Tutoring',
    href: '/categories/tutoring',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400',
    count: '150+ tutors',
    color: 'bg-scarlet-500',
  },
  {
    name: 'Food Delivery',
    href: '/categories/food-delivery',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
    count: '50+ restaurants',
    color: 'bg-orange-500',
  },
  {
    name: 'Services',
    href: '/categories/services',
    icon: Wrench,
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
    count: '100+ services',
    color: 'bg-indigo-500',
  },
];

export default function CategoryShowcase() {
  return (
    <section className="container-custom py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-charcoal-900 mb-4">
          Browse by Category
        </h2>
        <p className="text-lg text-charcoal-600 max-w-2xl mx-auto">
          Find exactly what you need from textbooks to tutoring
        </p>
      </div>

      <div className="category-grid">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div className="relative h-64">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${category.color} rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                <p className="text-white/90 text-sm">{category.count}</p>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-scarlet-500/0 group-hover:bg-scarlet-500/20 transition-colors duration-300"></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
