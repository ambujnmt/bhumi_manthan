import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/router";
import ForgotPassword from "../components/Forms/ForgotPassword";

export default function LoginPage() {
  const { user, authLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure code runs only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    if (user) {
      if (user.role === "seller" || user.role === "admin") {
        router.replace("/dashboard/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [user, mounted, authLoading, router]);

  // Render nothing until mounted
  if (!mounted || authLoading) return null;

  return <ForgotPassword />;
}
