import React, { useState } from "react";
import PrivateRoute from "../../../../components/PrivateRoute/PrivateRoute";
import Header from "../../../../components/Home/Menu/Header";
import Footer from "../../../../components/Home/Menu/Footer";
import MyOrderList from "../../../../components/User/Order/MyOrderList";

export default function UserProfile() {

  const [search, setSearch] = useState("");
const [timeFilter, setTimeFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");
  return (

    <PrivateRoute allowedRoles={["buyer"]}>

      <div>

        <Header />
        <div className="flex-1 overflow-auto ">
          <MyOrderList  
           search={search}
    setSearch={setSearch}
    timeFilter={timeFilter}
    setTimeFilter={setTimeFilter}
    statusFilter={statusFilter}
    setStatusFilter={setStatusFilter} />
        </div>

        <Footer />
      </div>

    </PrivateRoute>

  );
}
