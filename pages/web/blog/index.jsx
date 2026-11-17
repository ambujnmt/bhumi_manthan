import BlogList from "@/components/Innerpages/BlogDetail/BlogList";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import SideAds from "../../../components/Common/Ads/SideAds";

export default function blogs() {
    return (
        <>
            <Header />
            {/* Left / right ads beside the main section (Admin -> Ads) */}
            <SideAds sticky={false} railClass="lg:mt-10">
              <BlogList />
            </SideAds>
            <Footer />
        </>
    );
}
