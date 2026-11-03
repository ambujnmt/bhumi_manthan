import UserDashboardLayout from "@/components/User/Dashboard/UserDashboardLayout";
import MyWishlist from "@/components/User/MyWishlist/MyWishlist";

// The list comes from the login token: the id in the URL is not used
export default function UserWishlist() {
  return (
    <UserDashboardLayout>
      <MyWishlist />
    </UserDashboardLayout>
  );
}
