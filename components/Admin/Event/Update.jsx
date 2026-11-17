"use client";

import React from "react";
import { useRouter } from "next/router";
import EventForm from "./EventForm";

export default function Update() {
    const router = useRouter();

    if (!router.isReady) return null;

    return <EventForm key={router.query.id} eventId={router.query.id} />;
}
