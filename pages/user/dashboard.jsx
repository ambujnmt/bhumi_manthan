import { userDashboardLayout } from "../../components/User/Dashboard/UserDashboardLayout";
import DashboardOverview from "../../components/User/Dashboard/DashboardOverview";

export default function UserDashboard() {
  return <DashboardOverview />;
}

// Layout stays mounted across dashboard pages (no blink)
UserDashboard.getLayout = userDashboardLayout;
