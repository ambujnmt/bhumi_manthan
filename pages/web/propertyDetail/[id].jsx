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
            <PropertyDetails />
            <Footer />
        </>
    );
}

// Meta tags must be in the first HTML: crawlers and link previews don't wait for the client fetch.
// The page still loads its own data in the browser (is_compared needs the user's token).
export async function getServerSideProps({ params, req, res }) {
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
