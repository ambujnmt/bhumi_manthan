import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import Profile from "../../../components/Innerpages/profile/profile";
import { customerOnlyDashboardLayout } from "../../../components/User/Dashboard/UserDashboardLayout";
import { useUser } from "../../../context/UserContext";

export default function ProfilePage() {
    const { user, authLoading } = useUser();

    if (authLoading) return null;

    // Customers: inside the dashboard layout (getLayout below). Sellers, brokers and admins keep this page as it was.
    if (user?.role === "customer") {
        return <Profile dashboard />;
    }

    return (
        <>
            <Header />
            <Profile />
            <Footer />
        </>
    );
}

// Customers: same dashboard layout as the other dashboard pages, kept mounted (no blink)
ProfilePage.getLayout = customerOnlyDashboardLayout;
