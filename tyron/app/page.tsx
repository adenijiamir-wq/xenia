import Hero from '@/components/home/Hero';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import PopularServices from '@/components/home/PopularServices';
import TrendingDeals from '@/components/home/TrendingDeals';

export default function HomePage() {
  return (
    <div className="bg-white">
      <Hero />
      <CategoryShowcase />
      <TrendingDeals />
      <FeaturedProducts />
      <PopularServices />
    </div>
  );
}
