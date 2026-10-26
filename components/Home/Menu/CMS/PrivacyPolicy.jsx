'use client'

import React, { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { fetchPrivacyPolicies } from "../../../../utils/fetchApi";
import { Spinner } from "@heroui/react";

export default function PrivacyPolicy() {

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrivacyPolicy();
  }, []);

  const getPrivacyPolicy = async () => {
    try {
      const res = await fetchPrivacyPolicies();

      if (res?.status) {
        setPolicy(res.data);
      }
    } catch (error) {
      console.error("Error fetching privacy policy:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto">

      <Header />

      {/* PRIVACY POLICY SECTION */}
      <section className="w-full py-10 md:py-16 px-4 md:px-10 bg-[#f0f4fa]">

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className=" mx-auto bg-white p-6 md:p-10 rounded-xl shadow">

            {/* TITLE */}
            <h1 className="text-2xl md:text-3xl font-bold mb-6  text-[#004aad]">
              {policy?.title}
            </h1>

            {/* CONTENT (HTML from React Quill) */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: policy?.content }}
            />

          </div>
        )}

      </section>

      <Footer />

    </div>
  );
}