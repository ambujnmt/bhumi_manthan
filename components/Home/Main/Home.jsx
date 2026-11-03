import React from 'react'
import Header from "../Menu/Header"
import Body from "./Body"
import Footer from "../Menu/Footer"


export default function Home({ banners = null, listings = null, youtuberVideos = null }) {
  return (
    <section className='homePage'>
      {/* <TopBar /> */}
      <Header />
      <Body banners={banners} listings={listings} youtuberVideos={youtuberVideos} />
      <Footer />
    </section>
  )
}
