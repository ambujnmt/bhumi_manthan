import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";
import Profile from "../../../components/Innerpages/profile/profile";
import UserDashboardLayout from "../../../components/User/Dashboard/UserDashboardLayout";
import { useUser } from "../../../context/UserContext";

export default function ProfilePage() {
    const { user, authLoading } = useUser();

    if (authLoading) return null;

    // Customers get the dashboard. Sellers, brokers and admins keep this page as it was.
    if (user?.role === "customer") {
        return (
            <UserDashboardLayout>
                <Profile dashboard />
            </UserDashboardLayout>
        );
    }

    return (
        <>
            <Header />
            <Profile />
            <Footer />
        </>
    );
}
