'use client'

import React, { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { Spinner } from "@heroui/react";
import { Accordion, AccordionItem } from "@heroui/react";
import { fetchFAQs } from "../../../../utils/fetchApi";
import SideAds from "../../../Common/Ads/SideAds";

export default function FAQS() {

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    setLoading(true);
    const res = await fetchFAQs();

    if (res?.status) {
      // ✅ Only active FAQs
      const activeFaqs = res.data.filter(faq => faq.status === 1);
      setFaqs(activeFaqs);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto">

      <Header />
      {/* Left / right ads beside the main section (Admin -> Ads) */}
      <SideAds sticky={false} railClass="lg:mt-16">

        {/* FAQS SECTION */}
        {/* Background full width, content same width as other pages (container) */}
        <section className="w-full py-10 md:py-16 bg-[#f0f4fa]">
            <div className="container">

              {/* TITLE */}
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Frequently Asked <span className="text-[rgb(232,119,34)]">Questions</span>
                </h2>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                  Find answers to common questions quickly and easily.
                </p>
              </div>

              {/* CONTENT */}
              <div className=" mx-auto bg-white rounded-xl shadow p-4 md:p-6">

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                ) : faqs.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No FAQs available
                  </div>
                ) : (
                  <Accordion variant="splitted">
                    {faqs.map((faq) => (
                      <AccordionItem
                        key={faq.id}
                        aria-label={faq.question}
                        title={
                          <span className="font-medium text-gray-800">
                            {faq.question}
                          </span>
                        }
                      >
                        <div
                          className="text-gray-600 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}

              </div>

            </div>
        </section>

      </SideAds>
      <Footer />

    </div>
  );
}