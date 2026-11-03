import React from 'react'
import HeroCarousel from './HomeSections/HeroCarousel';
import PropertySearchBar from './HomeSections/PropertySearchBar';
import FeaturedProperties from './HomeSections/FeaturedProperties';
import NewProjects from './HomeSections/NewProjects';
import ExploreProperties from './HomeSections/ExploreProperties';
import PremiumLuxury from './HomeSections/PremiumLuxury';
import MiddleColumn from './HomeSections/MiddleColumn';
import HomeTestimonial from './HomeSections/HomeTestimonial';
import YoutuberVideos from './HomeSections/YoutuberVideos';
import UpcomingEvents from './HomeSections/UpcomingEvents';
import Blogs from './HomeSections/Blogs';
import MobileApp from './HomeSections/MobileApp';
import StickyLoginForm from '../../Innerpages/StickyLoginForm';
import useHomeListings from '../../../utils/useHomeListings';


// banners: loaded on server (pages/index.jsx), null = load in browser
export default function Body({ banners = null, listings = null, youtuberVideos = null }) {
  // Same nearby API as mobile app (/nearby/home), normal lists as fallback
  const { loading, featured, luxury, projects } = useHomeListings(listings);

  return (
    <>
      <StickyLoginForm />
      <HeroCarousel initialBanners={banners} />
      <PropertySearchBar />
      <FeaturedProperties loading={loading} properties={featured.items} nearby={featured.nearby} />
      <NewProjects loading={loading} projects={projects.items} nearby={projects.nearby} />
      <ExploreProperties />
      <PremiumLuxury loading={loading} properties={luxury.items} nearby={luxury.nearby} />
      <MiddleColumn />
      <HomeTestimonial />
      <YoutuberVideos initialVideos={youtuberVideos} />
      <UpcomingEvents />
      <Blogs />
      <MobileApp />
    </>
  );
}
