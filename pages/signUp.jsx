import React from "react";
import SignUp from "../components/Forms/SignUp";
import GuestRoute from "../components/GuestRoute/GuestRoute";

export default function SignUpPage() {
  return (
    <GuestRoute>
      <SignUp />
    </GuestRoute>
  );
}