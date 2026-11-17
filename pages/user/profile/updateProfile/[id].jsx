import React, { useState } from "react";
import PrivateRoute from "../../../../components/PrivateRoute/PrivateRoute";
import Header from "../../../../components/Home/Menu/Header";
import Footer from "../../../../components/Home/Menu/Footer";
import UpdateProfile from "../../../../components/User/UpdateProfile";

export default function UpdateProfilePage() {
  return (

    <PrivateRoute allowedRoles={["buyer"]}>

      <div>

        <Header />
        <div className="flex-1 overflow-auto ">
          <UpdateProfile />
        </div>

        <Footer />
      </div>

    </PrivateRoute>

  );
}
