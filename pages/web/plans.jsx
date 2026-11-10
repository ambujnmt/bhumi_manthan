import PlanList from "@/components/Innerpages/Plans/PlanList";
import Header from "../../components/Home/Menu/Header";
import Footer from "../../components/Home/Menu/Footer";
import { getPlans } from "../../utils/fetchApi";
import { fetchPageBanner } from "../../components/Common/PageBannerImage";

export default function Plans({ plans, banner }) {
    return (
        <>
            <Header />
            <PlanList initialPlans={plans} initialBanner={banner} />
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

    // Hero image: Admin -> Banner (type: Plans Page)
    const banner = await fetchPageBanner("plans");

    return {
        // undefined is not allowed in props: API failed -> PlanList loads the banner in browser
        props: { plans, ...(banner !== undefined && { banner }) },
        revalidate: 60,
    };
}
