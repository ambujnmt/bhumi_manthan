import React, { useState } from "react";
import SideMenu from "@/components/Admin/Dashboard/Menu/SideMenu";
import Header from "@/components/Admin/Dashboard/Menu/Header";
import Footer from "@/components/Admin/Dashboard/Menu/Footer";
import PrivateRoute from "../../../components/PrivateRoute/PrivateRoute";
import { AppointmentManager } from "../../../modules/appointments";

const propertyUrl = (item) => (item.bookable_type === "property" ? `/web/propertyDetail/${item.bookable_id}` : null);

// No permission prop: every panel user manages their own appointments (the API limits the data)
export default function Appointments() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <PrivateRoute allowedRoles={["super_admin"]} blockSeoOnly>
      <div className="flex h-screen overflow-hidden">
        {menuOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />
        )}

        <div
          className={`
            fixed top-0 left-0 h-full z-40
            transition-all duration-300
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
            ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"}
            w-64 bg-white
          `}
        >
          <SideMenu
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            menuOpen={menuOpen}
            toggleMenu={() => setMenuOpen(false)}
          />
        </div>

        <div
          className={`
            flex-1 flex flex-col min-w-0 transition-all duration-300 bg-[#f4f5fa]
            ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
          `}
        >
          <Header menuOpen={menuOpen} toggleMenu={() => setMenuOpen(!menuOpen)} />

          <div className="flex-1 overflow-y-auto p-4">
            <AppointmentManager getBookableUrl={propertyUrl} />
          </div>

          <Footer />
        </div>
      </div>
    </PrivateRoute>
  );
}
