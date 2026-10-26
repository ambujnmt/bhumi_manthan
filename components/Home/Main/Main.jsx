import React from 'react';
import Home from './Home';

export default function Main({ banners = null, listings = null }) {
  return <Home banners={banners} listings={listings} />;
}
