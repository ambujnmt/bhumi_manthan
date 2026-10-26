import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { fetchCategories } from "../../utils/fetchApi";
export default function Breadcrumb({
  title,
  categoryId,
  items = [],
  backgroundImage = "/assets/Images/tw-banner_2.jpg",
}) {
  const router = useRouter();
const [categoryName, setCategoryName] = React.useState("");
  // Auto generate if items are not passed
  const breadcrumbs =
    items.length > 0
      ? items
      : router.asPath
          .split("?")[0]
          .split("/")
          .filter(Boolean)
          .map((segment, index, arr) => ({
            label: decodeURIComponent(segment)
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()),
            href: "/" + arr.slice(0, index + 1).join("/"),
          }));

React.useEffect(() => {

  const loadCategory = async () => {

    if(!categoryId) return;

    try {

      const res = await fetchCategories();

      if(res?.status){

        const category = res.data.find(
          (item)=> Number(item.id) === Number(categoryId)
        );

        if(category){
          setCategoryName(category.name);
        }

      }

    } catch(error){
      console.log(error);
    }

  };


  loadCategory();

},[categoryId]);

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 lg:px-10 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title || categoryName || breadcrumbs[breadcrumbs.length - 1]?.label}
        </h1>

        <div className="flex items-center justify-center flex-wrap gap-2 text-white text-sm md:text-base">
          <Link href="/" className="hover:text-yellow-400 transition text-[#fff]">
            Home
          </Link>

          {breadcrumbs.map((item, index) => (
            <React.Fragment key={item.href}>
              <span>/</span>

              {index === breadcrumbs.length - 1 ? (
               <span className="text-yellow-400 font-semibold">
  {item.label === "Category" && categoryName
    ? categoryName
    : item.label}
</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-yellow-400 transition"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}