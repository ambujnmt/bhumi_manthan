import React from "react";
import VerifyOtp from "../components/Forms/VerifyOtp";
import GuestRoute from "../components/GuestRoute/GuestRoute";

export default function VerifyOtpPage() {
  return (
    <GuestRoute>
      <VerifyOtp />
    </GuestRoute>
  );
}