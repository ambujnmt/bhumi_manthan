import EventList from "@/components/Innerpages/Events/EventList";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import { getEvents } from "../../../utils/fetchApi";
import { fetchPageBanner } from "../../../components/Common/PageBannerImage";

export default function Events({ events, banner }) {
    return (
        <>
            <Header />
            <EventList initialEvents={events} initialBanner={banner} />
            <Footer />
        </>
    );
}

// Events come with the HTML (static page), rebuilt at most every 60 sec.
export async function getStaticProps() {
    let events = null;

    try {
        const res = await getEvents(50);
        events = res?.data?.events ?? [];
    } catch (error) {
        // API down at build time -> EventList loads events in browser
        console.error("Events fetch error:", error?.message);
    }

    // Hero image: Admin -> Banner (type: Events Page)
    const banner = await fetchPageBanner("events");

    return {
        // undefined is not allowed in props: API failed -> EventList loads the banner in browser
        props: { events, ...(banner !== undefined && { banner }) },
        revalidate: 60,
    };
}
