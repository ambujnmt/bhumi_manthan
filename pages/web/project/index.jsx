import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import MetaTags from "../../../components/Head/MetaTags";
import ProjectList from "../../../components/Innerpages/Projects/ProjectList";
import { SITE_NAME } from "../../../utils/seo";
import SideAds from "../../../components/Common/Ads/SideAds";

// New projects (header "New Projects" menu): ?launch_status= &builder= &city=
export default function Projects() {
  return (
    <>
      <MetaTags
        title={`New Projects | ${SITE_NAME}`}
        description="New launches, under construction and ready to move projects from trusted builders on Bhumi Manthan."
      />
      <Header />
      {/* Left / right ads beside the main section (Admin -> Ads) */}
      <SideAds sticky={false} railClass="lg:mt-10">
        <ProjectList />
      </SideAds>
      <Footer />
    </>
  );
}
