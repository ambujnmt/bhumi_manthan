import EventList from "@/components/Innerpages/Events/EventList";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import { getEvents } from "../../../utils/fetchApi";

export default function Events({ events }) {
    return (
        <>
            <Header />
            <EventList initialEvents={events} />
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

    return {
        props: { events },
        revalidate: 60,
    };
}
