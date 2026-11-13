import { userDashboardLayout } from "../../components/User/Dashboard/UserDashboardLayout";
import NearbyAgents from "../../components/User/NearbyAgents/NearbyAgents";

// Customer dashboard: brokers & sellers active near the user
export default function UserNearbyAgents() {
  return <NearbyAgents />;
}

// Layout stays mounted across dashboard pages (no blink)
UserNearbyAgents.getLayout = userDashboardLayout;
