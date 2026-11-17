import React, { useState } from "react";
import PrivateRoute from "../../../components/PrivateRoute/PrivateRoute";
import Profile from "../../../components/User/Profile";
import Header from "../../../components/Home/Menu/Header";
import Footer from "../../../components/Home/Menu/Footer";

export default function UserProfile() {
  return (

    <PrivateRoute allowedRoles={["buyer"]}>

      <div>

        <Header />
        <div className="flex-1 overflow-auto ">
          <Profile />
        </div>

        <Footer />
      </div>

    </PrivateRoute>

  );
}
