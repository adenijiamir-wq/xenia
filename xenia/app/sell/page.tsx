'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function SellPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 py-12">
      <div className="container-custom">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-charcoal-900 mb-4">
            Start Selling Today
          </h1>
          <p className="text-xl text-charcoal-800">
            Turn your unused items into cash! It's fast, easy, and free to start.
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-charcoal-900 mb-6">List Your Item</h2>
          
          {submitted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700 font-medium">
                ✅ Your item has been listed successfully!
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                What are you selling?
              </label>
              <select 
                required
                className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all"
              >
                <option value="">Choose type...</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="food">Food Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., MacBook Pro 13 inch"
                className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                Description
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your item..."
                className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                  Category
                </label>
                <select 
                  required
                  className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all"
                >
                  <option value="">Select...</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="books">Books</option>
                  <option value="clothing">Fashion</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                Upload Photos
              </label>
              <div className="border-2 border-dashed border-charcoal-300 rounded-xl p-8 text-center hover:border-scarlet-500 transition-all cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-2 text-charcoal-400" />
                <p className="text-charcoal-600">Click to upload images</p>
                <p className="text-sm text-charcoal-400 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                Your Contact Email
              </label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-charcoal-200 rounded-xl focus:border-scarlet-500 focus:ring-2 focus:ring-scarlet-200 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              List My Item →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
