import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-scarlet-500 mb-4">TYRON</h3>
            <p className="text-charcoal-300 mb-4">
              The student marketplace for buying, selling, and booking services at Rutgers University.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-charcoal-400 hover:text-scarlet-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-scarlet-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-scarlet-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-charcoal-400 hover:text-scarlet-500 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-charcoal-300">
              <li><Link href="/categories/textbooks" className="hover:text-white transition-colors">Textbooks</Link></li>
              <li><Link href="/categories/electronics" className="hover:text-white transition-colors">Electronics</Link></li>
              <li><Link href="/categories/furniture" className="hover:text-white transition-colors">Furniture</Link></li>
              <li><Link href="/deals" className="hover:text-white transition-colors">Today's Deals</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-charcoal-300">
              <li><Link href="/categories/tutoring" className="hover:text-white transition-colors">Tutoring</Link></li>
              <li><Link href="/categories/food-delivery" className="hover:text-white transition-colors">Food Delivery</Link></li>
              <li><Link href="/categories/services" className="hover:text-white transition-colors">All Services</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">Sell on TYRON</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold mb-4">Help & Support</h4>
            <ul className="space-y-2 text-charcoal-300">
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-white transition-colors">Safety Guidelines</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-charcoal-800 text-center text-charcoal-400 text-sm">
          <p>&copy; 2024 TYRON. All rights reserved. Made with ❤️ for Rutgers students.</p>
        </div>
      </div>
    </footer>
  );
}
