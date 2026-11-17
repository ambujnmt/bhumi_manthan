import React, { useEffect, useState } from "react";
import Login from "../components/Forms/Login";
import { useUser } from "../context/UserContext";
import GuestRoute from "../components/GuestRoute/GuestRoute";

export default function LoginPage() {
  const { authLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return null;
  }

  return (
    <GuestRoute>
      <Login />
    </GuestRoute>
  );
}