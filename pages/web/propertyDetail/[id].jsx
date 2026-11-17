import Footer from "../../../components/Home/Menu/Footer";
import Header from "../../../components/Home/Menu/Header";
import MetaTags from "../../../components/Head/MetaTags";
import PropertyDetails from "../../../components/Innerpages/PropertyDetails/PropertyDetails";
import { SITE_NAME, buildPropertySeo } from "../../../utils/seo";

export default function propertyDetails({ seo }) {
    return (
        <>
            {seo && <MetaTags {...seo} />}
            <Header />
            {/* No server meta on in-app navigation: the page sets the title from its own fetch.
                Ads of this page sit beside the image section (inside PropertyDetails) */}
            <PropertyDetails clientSeo={!seo} />
            <Footer />
        </>
    );
}

// Meta tags must be in the first HTML: crawlers and link previews don't wait for the client fetch.
// The page still loads its own data in the browser (is_compared needs the user's token).
export async function getServerSideProps({ params, req, res }) {
    // In-app navigation (Link / router.push) asks for /_next/data/...json, not HTML.
    // Crawlers never do this, and waiting on the API here held the old property on screen
    // until it answered, then the page fetched the same data again. Skip it so the URL
    // change shows the new property's loader at once.
    if (req.url?.startsWith("/_next/data/")) {
        return { props: { seo: null } };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}properties/detail/${encodeURIComponent(params.id)}`,
            {
                headers: { Accept: "application/json" },
                signal: AbortSignal.timeout(5000),
            }
        );

        if (response.status === 404) {
            res.statusCode = 404;

            return {
                props: { seo: { title: `Property not found | ${SITE_NAME}`, robots: "noindex" } },
            };
        }

        const property = (await response.json())?.data?.property;

        if (!response.ok || !property) {
            return { props: { seo: null } };
        }

        const protocol = req.headers["x-forwarded-proto"]?.split(",")[0] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        const seo = buildPropertySeo(property);

        return {
            props: {
                seo: {
                    ...seo,
                    siteName: SITE_NAME,
                    type: "website",
                    image: property.main_image || null,
                    canonical: `${protocol}://${host}/web/propertyDetail/${property.slug || property.id}`,
                },
            },
        };
    } catch (error) {
        // API down or slow: page still opens, the browser fetch shows the error state
        return { props: { seo: null } };
    }
}
