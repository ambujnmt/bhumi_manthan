import Header from "../../components/Home/Menu/Header";
import Footer from "../../components/Home/Menu/Footer";
import MetaTags from "../../components/Head/MetaTags";
import VideoTourList from "../../components/Innerpages/VideoTour/VideoTourList";
import { getYoutuberVideos } from "../../utils/fetchApi";
import { SITE_NAME } from "../../utils/seo";

export default function VideoTour({ videos }) {
    return (
        <>
            <MetaTags
                title={`Video Tour | ${SITE_NAME}`}
                description="Watch Bhumi Manthan property tours, project walkthroughs and reviews."
            />
            <Header />
            <VideoTourList initialVideos={videos} />
            <Footer />
        </>
    );
}

// Videos come with the HTML (static page), rebuilt at most every 60 sec.
export async function getStaticProps() {
    let videos = null;

    try {
        const res = await getYoutuberVideos();
        videos = res?.data?.videos ?? [];
    } catch (error) {
        // API down at build time -> VideoTourList loads videos in browser
        console.error("Video tour fetch error:", error?.message);
    }

    return {
        props: { videos },
        revalidate: 60,
    };
}
