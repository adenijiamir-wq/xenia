'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Main Hero */}
      <div className="hero-gradient">
        <div className="container-custom py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">New to Rutgers? Start here!</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Everything You Need,
                <br />
                <span className="text-white/90">One Marketplace</span>
              </h1>
              
              <p className="text-xl text-white/90 max-w-lg">
                Buy textbooks, sell furniture, book tutoring, order food - all from fellow Rutgers students and local businesses.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/categories"
                  className="bg-white text-scarlet-500 px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-all hover:scale-105 flex items-center gap-2"
                >
                  Start Shopping
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/sell"
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all"
                >
                  Sell Your Stuff
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold">2,500+</div>
                  <div className="text-white/80 text-sm">Active Listings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-white/80 text-sm">Rutgers Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-white/80 text-sm">Services</div>
                </div>
              </div>
            </div>

            {/* Right Image Grid */}
            <div className="hidden md:grid grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop"
                    alt="Textbooks"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 image-overlay"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Textbooks</h3>
                    <p className="text-sm">Save up to 80%</p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=300&fit=crop"
                    alt="Furniture"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 image-overlay"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold">Furniture</h3>
                    <p className="text-sm">Dorm essentials</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=300&fit=crop"
                    alt="Tutoring"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 image-overlay"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold">Tutoring</h3>
                    <p className="text-sm">Ace your exams</p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop"
                    alt="Electronics"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 image-overlay"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg">Electronics</h3>
                    <p className="text-sm">Latest tech deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="relative -mt-1">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
