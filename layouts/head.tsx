// import React from "react";
// import NextHead from "next/head";

// import { siteConfig } from "@/config/site";

// export const Head = () => {
//   return (
//     <NextHead>
//       <title>{siteConfig.name}</title>
//       <meta key="title" content={siteConfig.name} property="og:title" />
//       <meta content={siteConfig.description} property="og:description" />
//       <meta content={siteConfig.description} name="description" />
//       <meta
//         key="viewport"
//         content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
//         name="viewport"
//       />
//       <link href="/favicon.ico" rel="icon" />

//       <meta name="viewport" content="width=device-width, initial-scale=1" />
//     </NextHead>
//   );
// };


import React from "react";
import NextHead from "next/head";

import { siteConfig } from "@/config/site";

export const Head = () => {
  return (
    <NextHead>
      <title>{siteConfig.name}</title>
      <meta key="title" content={siteConfig.name} property="og:title" />
      <meta content={siteConfig.description} property="og:description" />
      <meta content={siteConfig.description} name="description" />
      
      {/* Fixed: Single viewport meta tag with proper responsive settings */}
      <meta
        key="viewport"
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
      />
      
      <link href="/favicon.png" rel="icon" />
    </NextHead>
  );
};