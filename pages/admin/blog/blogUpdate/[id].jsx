import React, { useState } from "react";
import { useRouter } from "next/router";
import SideMenu from "@/components/Admin/Dashboard/Menu/SideMenu";
import Header from "@/components/Admin/Dashboard/Menu/Header";
import Footer from "@/components/Admin/Dashboard/Menu/Footer";
import PrivateRoute from "../../../../components/PrivateRoute/PrivateRoute";
import BlogForm from "../../../../components/Admin/Blog/BlogForm";

export default function UpdateBlog() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
       <PrivateRoute allowedRoles={["super_admin"]} permission="blogs.edit">
      <div className="flex h-screen overflow-hidden">

        {/* Overlay for mobile */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
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
            toggleCollapse={() =>
              setIsSidebarCollapsed(!isSidebarCollapsed)
            }
            menuOpen={menuOpen}
            toggleMenu={() => setMenuOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div
          className={`
            flex-1 flex flex-col min-w-0 transition-all duration-300 bg-[#f4f5fa]

            ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
          `}
        >
          {/* Header */}
          <Header
            menuOpen={menuOpen}
            toggleMenu={() => setMenuOpen(!menuOpen)}
          />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {router.isReady && <BlogForm blogId={router.query.id} />}
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
 </PrivateRoute>
  );
}
