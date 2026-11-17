import Footer from "../../components/Home/Menu/Footer";
import Header from "../../components/Home/Menu/Header";
import MetaTags from "../../components/Head/MetaTags";
import CompareProperties from "../../components/Innerpages/Compare/CompareProperties";
import { SITE_NAME } from "../../utils/seo";
import SideAds from "../../components/Common/Ads/SideAds";

export default function Compare() {
    return (
        <>
            {/* Each user's own list: nothing here for search engines */}
            <MetaTags title={`Compare Properties | ${SITE_NAME}`} robots="noindex" />
            <Header />
            {/* Left / right ads beside the main section (Admin -> Ads) */}
            <SideAds sticky={false} railClass="lg:mt-8">
              <CompareProperties />
            </SideAds>
            <Footer />
        </>
    );
}
