import { userDashboardLayout } from "../../components/User/Dashboard/UserDashboardLayout";
import RecentlyViewed from "../../components/User/RecentlyViewed/RecentlyViewed";

// Customer dashboard: properties the customer opened (latest first)
export default function UserRecentView() {
  return <RecentlyViewed />;
}

// Layout stays mounted across dashboard pages (no blink)
UserRecentView.getLayout = userDashboardLayout;
