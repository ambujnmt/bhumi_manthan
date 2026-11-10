import { userDashboardLayout } from "../../components/User/Dashboard/UserDashboardLayout";
import MyEnquiries from "../../components/User/MyEnquiries/MyEnquiries";

// Customer dashboard: property enquiries the customer sent (latest first)
export default function UserMyEnquiries() {
  return <MyEnquiries />;
}

// Layout stays mounted across dashboard pages (no blink)
UserMyEnquiries.getLayout = userDashboardLayout;
