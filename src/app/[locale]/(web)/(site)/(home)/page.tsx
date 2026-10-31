import HomeBenefits from './HomeBenefits';
import HomeCTA from './HomeCTA';
import HomeFeatures from './HomeFeatures';
import HomeHero from './HomeHero';
import HomeStudyRooms from './HomeStudyRooms';
import HomeTestimonials from './HomeTestimoials';

export default function Home() {
  return (
    <div className="mb-8">
      <HomeHero />
      <HomeFeatures />
      <HomeStudyRooms />
      <HomeBenefits />
      <HomeTestimonials />
      <HomeCTA />
    </div>
  );
}
