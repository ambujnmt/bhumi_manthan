import { userDashboardLayout } from "../../components/User/Dashboard/UserDashboardLayout";
import { MyAppointments } from "../../modules/appointments";

const propertyUrl = (item) => (item.bookable_type === "property" ? `/web/propertyDetail/${item.bookable_id}` : null);

export default function UserAppointments() {
  return <MyAppointments getBookableUrl={propertyUrl} />;
}

// Layout stays mounted across dashboard pages (no blink)
UserAppointments.getLayout = userDashboardLayout;
