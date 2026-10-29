import EventDetail from "@/components/Innerpages/Events/EventDetail";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import { getEventDetail, getEvents } from "../../../utils/fetchApi";
import { splitEvents } from "../../../components/Innerpages/Events/eventUtils";

export default function EventDetailPage({ event, moreEvents }) {
    return (
        <>
            <Header />
            <EventDetail key={event.id} event={event} moreEvents={moreEvents} />
            <Footer />
        </>
    );
}

// Latest events are built ahead; any other slug is built on first visit (no spinner).
export async function getStaticPaths() {
    let paths = [];

    try {
        const res = await getEvents(50);

        paths = (res?.data?.events ?? [])
            .filter((event) => event?.slug)
            .map((event) => ({ params: { slug: String(event.slug) } }));
    } catch (error) {
        // API down at build time -> every event is built on first visit
        console.error("Event paths fetch error:", error?.message);
    }

    return { paths, fallback: "blocking" };
}

// Page is rebuilt at most every 60 sec, so admin changes show within a minute.
export async function getStaticProps({ params }) {
    let event = null;
    let moreEvents = [];

    try {
        const [detailRes, listRes] = await Promise.all([
            getEventDetail(params.slug),
            getEvents(20).catch(() => null),
        ]);

        event = detailRes?.data?.event ?? null;

        // Other upcoming events first, then recent past ones
        const { upcoming, past } = splitEvents(
            (listRes?.data?.events ?? []).filter((item) => item.id !== event?.id)
        );
        moreEvents = [...upcoming, ...past].slice(0, 3);
    } catch (error) {
        event = null;
    }

    if (!event) {
        return { notFound: true, revalidate: 60 };
    }

    return {
        props: { event, moreEvents },
        revalidate: 60,
    };
}
