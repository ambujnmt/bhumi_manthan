import UserDashboardLayout from "../../components/User/Dashboard/UserDashboardLayout";
import { MyAppointments } from "../../modules/appointments";

const propertyUrl = (item) => (item.bookable_type === "property" ? `/web/propertyDetail/${item.bookable_id}` : null);

export default function UserAppointments() {
  return (
    <UserDashboardLayout>
      <MyAppointments getBookableUrl={propertyUrl} />
    </UserDashboardLayout>
  );
}
