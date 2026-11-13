import ProjectDetail from "../../../../components/Innerpages/Projects/ProjectDetail";
import Footer from "../../../../components/Home/Menu/Footer";
import Header from "../../../../components/Home/Menu/Header";

// Ads of this page sit beside the image section (inside ProjectDetail), not beside the whole page
export default function propertyDetails() {
    return (
        <>
            <Header />
            <ProjectDetail />
            <Footer />
        </>
    );
}
