import BlogDetail from "@/components/Innerpages/BlogDetail/BlogDetail";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import MetaTags from "../../../components/Head/MetaTags";
import { getBlogDetail, getBlogs } from "../../../utils/fetchApi";
import { SITE_NAME, buildBlogSeo } from "../../../utils/seo";

export default function blogDetail({ blog, moreBlogs }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    return (
        <>
            <MetaTags
                {...buildBlogSeo(blog)}
                siteName={SITE_NAME}
                type="article"
                image={blog.image}
                canonical={siteUrl ? `${siteUrl}/web/blog/${blog.slug}` : undefined}
            />
            <Header />
            {/* Ads of this page sit beside the hero image (inside BlogDetail) */}
            <BlogDetail blog={blog} moreBlogs={moreBlogs} />
            <Footer />
        </>
    );
}

// Latest blogs are built ahead; any other slug is built on first visit (no spinner).
export async function getStaticPaths() {
    let paths = [];

    try {
        const res = await getBlogs(50);

        paths = (res?.data?.blogs ?? [])
            .filter((blog) => blog?.slug)
            .map((blog) => ({ params: { slug: String(blog.slug) } }));
    } catch (error) {
        // API down at build time -> every blog is built on first visit
        console.error("Blog paths fetch error:", error?.message);
    }

    return { paths, fallback: "blocking" };
}

// Blog content comes with the HTML (static page).
// Page is rebuilt at most every 60 sec, so admin changes show within a minute.
export async function getStaticProps({ params }) {
    let blog = null;
    let moreBlogs = [];

    try {
        const [detailRes, listRes] = await Promise.all([
            getBlogDetail(params.slug),
            getBlogs(4).catch(() => null),
        ]);

        blog = detailRes?.data?.blog ?? null;
        moreBlogs = (listRes?.data?.blogs ?? [])
            .filter((item) => item.slug !== params.slug)
            .slice(0, 3);
    } catch (error) {
        blog = null;
    }

    if (!blog) {
        return { notFound: true, revalidate: 60 };
    }

    return {
        props: { blog, moreBlogs },
        revalidate: 60,
    };
}
