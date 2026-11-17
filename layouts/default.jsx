import React from "react";
import NextHead from "next/head";
import { HeroUIProvider } from "@heroui/react";
import { SITE_FAVICON_URL } from "@/utils/useSiteLogo";

export default function DefaultLayout({ children }) {
  return (
    <div
      style={{
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <NextHead>
        <link
          key="favicon"
          rel="icon"
          href={SITE_FAVICON_URL}
        />
        <link
          key="apple-touch-icon"
          rel="apple-touch-icon"
          href={SITE_FAVICON_URL}
        />
      </NextHead>

      <main>{children}</main>
    </div>
  );
}