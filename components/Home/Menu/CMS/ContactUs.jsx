'use client'

import React, { useEffect, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { TextField, Button } from "@mui/material";
import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { submitContactForm, fetchContactSettings } from "../../../../utils/fetchApi";
import { Link, Spinner } from "@heroui/react";

export default function ContactUs() {
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [contactData, setContactData] = useState(null);

    useEffect(() => {
        const getContactData = async () => {
            const res = await fetchContactSettings();
            if (res?.status) {
                setContactData(res.data);
            }
        };

        getContactData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        const res = await submitContactForm(formData);

        if (res?.status) {
            setSuccessMsg(res.message);

            // clear form
            setFormData({
                fname: "",
                lname: "",
                phone: "",
                email: "",
                message: "",
            });

            // 👉 auto hide after 3 sec
            setTimeout(() => {
                setSuccessMsg("");
            }, 3000);

        } else {
            setErrorMsg(res?.message);

            // optional: auto hide error also
            setTimeout(() => {
                setErrorMsg("");
            }, 3000);
        }
        setLoading(false);
    };
    const [formData, setFormData] = useState({
        fname: "",
        lname: "",
        phone: "",
        email: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    return (
        <div className="mx-auto">
            <Header />

            {/* CONTACT SECTION */}
            <section className="w-full py-10 md:py-16 px-4 md:px-10 bg-[#f0f4fa]">

                <div className="text-center max-w-3xl mx-auto">

                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                        Contact Us
                    </h1>

                    <h2 className="text-2xl md:text-4xl font-semibold text-gray-800">
                        Choose Your Preferred{" "}
                        <span className="text-[rgb(9,71,139)]">Contact Method</span>
                    </h2>

                    <p className="mt-4 text-gray-600 text-sm md:text-base">
                        Multiple channels designed for your convenience. All inquiries
                        routed to specialized teams for faster resolution.
                    </p>
                </div>

                {/* FORM SECTION */}
                <div className=" mx-auto mt-12 bg-white p-6 md:p-10 rounded-2xl shadow-md">

                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 text-center">
                        Get in touch with us
                    </h3>

                    {successMsg && (
                        <p className="text-green-600 text-center mb-4">{successMsg}</p>
                    )}

                    {errorMsg && (
                        <p className="text-red-600 text-center mb-4">{errorMsg}</p>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <TextField
                            label="First Name"
                            name="fname"
                            value={formData.fname}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Last Name"
                            name="lname"
                            value={formData.lname}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <div className="md:col-span-2">
                            <TextField
                                label="Message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={4}
                            />
                        </div>

                        <div className="md:col-span-2 text-center mt-4">
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={loading}
                                className="!bg-[rgb(9,71,139)] hover:!bg-blue-700 !px-8 !py-3"
                            >
                                {loading ? <Spinner color="default" /> : "Submit Message"}
                            </Button>
                        </div>

                    </form>
                </div>


                {/* CONTACT INFO BOXES */}
                <div className="mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* ADDRESS */}
                    <div className="bg-white border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-[rgb(9,71,139)] text-white text-xl mb-4">
                            <FaLocationDot />
                        </div>
                        <h5 className="font-semibold text-lg text-gray-800 mb-2">
                            Find us at:
                        </h5>
                        <p className="text-gray-600 text-sm">
                            {contactData?.address}
                        </p>
                    </div>

                    {/* PHONE */}
                    <div className="bg-white border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-[rgb(9,71,139)] text-white text-xl mb-4">
                            <FaPhoneAlt />
                        </div>
                        <h5 className="font-semibold text-lg text-gray-800 mb-2">
                            Call or text us at:
                        </h5>
                        <Link
                            href={`tel:${contactData?.phone}`}
                            className="text-gray-600 text-sm hover:text-blue-600"
                        >
                            {contactData?.phone}
                        </Link>
                    </div>

                    {/* EMAIL */}
                    <div className="bg-white border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition">
                        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-[rgb(9,71,139)] text-white text-xl mb-4">
                            <FaEnvelope />
                        </div>
                        <h5 className="font-semibold text-lg text-gray-800 mb-2">
                            Email us at:
                        </h5>
                        <Link
                            href={`mailto:${contactData?.email}`}
                            className="text-gray-600 text-sm hover:text-blue-600"
                            target="_blank"
                        >
                            {contactData?.email}
                        </Link>
                    </div>

                </div>
            </section>

            {/* MAP SECTION */}
            <div className="w-full  bg-[#f0f4fa]">

                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 text-center mb-6">
                    Our Location
                </h3>

                <div className="w-full h-[250px] md:h-[450px] overflow-hidden shadow-md">
                    <iframe
                        title="Google Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={
                            contactData?.location_url
                                ? `${contactData.location_url}&output=embed`
                                : ""
                        }
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

            </div>

            <Footer />
        </div>
    );
}