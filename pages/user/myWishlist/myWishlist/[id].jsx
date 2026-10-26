import React, { useState } from "react";
import PrivateRoute from "../../../../components/PrivateRoute/PrivateRoute";
import Header from "../../../../components/Home/Menu/Header";
import Footer from "../../../../components/Home/Menu/Footer";
import MyWishlist from "@/components/User/MyWishlist/MyWishlist";

export default function UserProfile() {
  return (

    <PrivateRoute allowedRoles={["buyer"]}>

      <div>

        <Header />
        <div className="flex-1 overflow-auto ">
          <MyWishlist />
        </div>

        <Footer />
      </div>

    </PrivateRoute>

  );
}
