import PlanList from "@/components/Innerpages/Plans/PlanList";
import Header from "../../components/Home/Menu/Header";
import Footer from "../../components/Home/Menu/Footer";
import { getPlans } from "../../utils/fetchApi";

export default function Plans({ plans }) {
    return (
        <>
            <Header />
            <PlanList initialPlans={plans} />
            <Footer />
        </>
    );
}

// Plans come with the HTML (static page), rebuilt at most every 60 sec.
export async function getStaticProps() {
    let plans = null;

    try {
        const res = await getPlans();
        plans = res?.data?.plans ?? [];
    } catch (error) {
        // API down at build time -> PlanList loads plans in browser
        console.error("Plans fetch error:", error?.message);
    }

    return {
        props: { plans },
        revalidate: 60,
    };
}
