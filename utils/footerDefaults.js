// Default footer content.
// Used by website Footer until admin saves Footer Settings,
// and as the starting values of the admin Footer Settings form.

const footerDefaults = {
  logo: "/assets/img/footer-logo.png",

  about_text:
    "bhumimanthan.com is India's leading unified real estate platform designed to make finding, buying, renting and growing assets streamlined and trustworthy.",

  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    youtube: "",
  },

  columns: [
    {
      title: "Quick Links",
      links: [
        { title: "About Us", href: "#" },
        { title: "Contact Us", href: "/user/cms/contactUs" },
        { title: "Careers", href: "#" },
        { title: "Blog & Articles", href: "/web/blog" },
      ],
    },
    {
      title: "Our Services",
      links: [
        { title: "Buy Properties", href: "/web/property/searchProperties" },
        { title: "Rent Properties", href: "/web/property/searchProperties" },
        { title: "Commercial Spaces", href: "/web/property/searchProperties" },
        { title: "Land & Plots", href: "/web/property/searchProperties" },
        { title: "Builder Directory", href: "#" },
        { title: "Post Property Free", href: "/signUp" },
      ],
    },
    {
      title: "Loans & Finance",
      links: [
        { title: "Home Loans", href: "#" },
        { title: "Gold Loans", href: "#" },
        { title: "Property Valuation", href: "#" },
        { title: "Legal Verification", href: "#" },
        { title: "Escrow Services", href: "#" },
        { title: "Trusted Partners", href: "#" },
      ],
    },
  ],

  contact: {
    address: "123 2nd Floor, Sector 62, Noida, Uttar Pradesh - 201301",
    phone: "+91 98765 43201",
    email: "info@bhumimanthan.com",
    hours: "Mon - Sat : 10AM - 7:00 PM",
  },

  show_cities: true,
  cities_title: "Major Cities in India",

  // {year} is replaced with the current year
  copyright: "Copyright © {year} bhumimanthan.com. All rights reserved.",

  bottom_links: [
    { title: "Privacy Policy", href: "/user/cms/privacyPolicy" },
    { title: "Terms & Conditions", href: "/user/cms/termsAndCondition" },
  ],
};

// Saved settings on top of defaults (missing keys -> default)
export const mergeFooter = (saved) => {
  if (!saved) return footerDefaults;

  return {
    ...footerDefaults,
    ...saved,
    logo: saved.logo || footerDefaults.logo,
    social: { ...footerDefaults.social, ...(saved.social || {}) },
    contact: { ...footerDefaults.contact, ...(saved.contact || {}) },
    columns: Array.isArray(saved.columns) ? saved.columns : footerDefaults.columns,
    bottom_links: Array.isArray(saved.bottom_links) ? saved.bottom_links : footerDefaults.bottom_links,
  };
};

export default footerDefaults;
