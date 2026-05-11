'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu, X, MapPin } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar - Red Background */}
      <div className="bg-scarlet-500 text-white">
        <div className="container-custom py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Rutgers University</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/sell" className="hover:underline">
                Sell on TYRON
              </Link>
              <Link href="/help" className="hover:underline">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-4">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold text-scarlet-500 tracking-tight">
              TYRON
            </h1>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, services, textbooks..."
                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-charcoal-200 focus:border-scarlet-500 focus:outline-none focus:ring-2 focus:ring-scarlet-100 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-scarlet-500 text-white px-6 py-2 rounded-full hover:bg-scarlet-600 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              <Link
                href="/account"
                className="flex items-center gap-2 text-charcoal-700 hover:text-scarlet-500 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Account</span>
              </Link>
              <Link
                href="/cart"
                className="relative flex items-center gap-2 text-charcoal-700 hover:text-scarlet-500 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">Cart</span>
                <span className="absolute -top-2 -right-2 bg-scarlet-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-charcoal-700 hover:text-scarlet-500"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="border-t border-charcoal-100">
        <div className="container-custom py-3">
          <nav className="hidden md:flex items-center gap-6 text-sm overflow-x-auto custom-scrollbar">
            <Link href="/categories/textbooks" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              Textbooks
            </Link>
            <Link href="/categories/electronics" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              Electronics
            </Link>
            <Link href="/categories/furniture" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              Furniture
            </Link>
            <Link href="/categories/tutoring" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              Tutoring
            </Link>
            <Link href="/categories/food-delivery" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              Food Delivery
            </Link>
            <Link href="/categories/services" className="whitespace-nowrap font-medium text-charcoal-700 hover:text-scarlet-500 transition-colors">
              All Services
            </Link>
            <Link href="/deals" className="whitespace-nowrap font-medium text-scarlet-500 hover:text-scarlet-600 transition-colors">
              Today's Deals
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-charcoal-100 bg-white">
          <nav className="container-custom py-4 space-y-3">
            <Link href="/account" className="block py-2 text-charcoal-700 hover:text-scarlet-500 font-medium">
              Account
            </Link>
            <Link href="/cart" className="block py-2 text-charcoal-700 hover:text-scarlet-500 font-medium">
              Cart (0)
            </Link>
            <Link href="/sell" className="block py-2 text-charcoal-700 hover:text-scarlet-500 font-medium">
              Sell on TYRON
            </Link>
            <div className="pt-3 border-t border-charcoal-100 space-y-2">
              <Link href="/categories/textbooks" className="block py-2 text-charcoal-600 hover:text-scarlet-500">
                Textbooks
              </Link>
              <Link href="/categories/electronics" className="block py-2 text-charcoal-600 hover:text-scarlet-500">
                Electronics
              </Link>
              <Link href="/categories/furniture" className="block py-2 text-charcoal-600 hover:text-scarlet-500">
                Furniture
              </Link>
              <Link href="/categories/tutoring" className="block py-2 text-charcoal-600 hover:text-scarlet-500">
                Tutoring
              </Link>
              <Link href="/categories/services" className="block py-2 text-charcoal-600 hover:text-scarlet-500">
                All Services
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
