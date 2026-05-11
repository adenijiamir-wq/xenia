'use client';

import { User, ShoppingBag, Heart, Settings } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-charcoal-50 py-8">
      <div className="container-custom">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-scarlet-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              JD
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-charcoal-900 mb-1">John Doe</h1>
              <p className="text-charcoal-600 mb-2">john.doe@email.com</p>
              <div className="flex gap-4 text-sm">
                <span className="text-charcoal-600">Member since Jan 2024</span>
                <span className="text-scarlet-500 font-semibold">⭐ 4.9 Rating</span>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <ShoppingBag className="w-10 h-10 text-scarlet-500 mb-3" />
            <h3 className="text-3xl font-bold text-charcoal-900 mb-1">12</h3>
            <p className="text-charcoal-600">Active Listings</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Heart className="w-10 h-10 text-scarlet-500 mb-3" />
            <h3 className="text-3xl font-bold text-charcoal-900 mb-1">45</h3>
            <p className="text-charcoal-600">Favorites</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <User className="w-10 h-10 text-scarlet-500 mb-3" />
            <h3 className="text-3xl font-bold text-charcoal-900 mb-1">87</h3>
            <p className="text-charcoal-600">Transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex gap-4 border-b border-charcoal-200 mb-6">
            <button className="pb-4 px-2 font-semibold text-scarlet-500 border-b-2 border-scarlet-500">
              My Listings
            </button>
            <button className="pb-4 px-2 font-semibold text-charcoal-600 hover:text-scarlet-500">
              Purchases
            </button>
            <button className="pb-4 px-2 font-semibold text-charcoal-600 hover:text-scarlet-500">
              Favorites
            </button>
            <button className="pb-4 px-2 font-semibold text-charcoal-600 hover:text-scarlet-500">
              Reviews
            </button>
          </div>

          {/* Listings */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-charcoal-200 rounded-xl hover:border-scarlet-500 transition-all">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200"
                alt="Product"
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-900 mb-1">MacBook Pro 13"</h3>
                <p className="text-charcoal-600 text-sm mb-2">Listed 3 days ago</p>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-charcoal-900">$799</p>
                <p className="text-sm text-charcoal-600">12 views</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-charcoal-200 rounded-xl hover:border-scarlet-500 transition-all">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200"
                alt="Product"
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-bold text-charcoal-900 mb-1">Modern Desk & Chair</h3>
                <p className="text-charcoal-600 text-sm mb-2">Listed 1 week ago</p>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-charcoal-900">$120</p>
                <p className="text-sm text-charcoal-600">28 views</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
