import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiX } from "react-icons/fi";
import { getProjects } from "../../../utils/fetchApi";
import { imageFallback } from "../../../utils/formatPrice";
import Pagination from "../../Common/Pagination";
import { PROJECT_DEVELOPERS, PROJECT_STAGES, projectsHref } from "../../../utils/projectFilters";

const FALLBACK_IMAGE = "/assets/img/pro-1.png";

// Projects per page (?page=2 in the URL)
const PER_PAGE = 40;

// ₹2.45 Cr onwards / ₹42.00 Lakh onwards (same as home "New Projects")
const priceText = (project) => {
  if (project.price_label) return project.price_label;

  const price = Number(project.starting_price);
  if (!price) return "";
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr onwards`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh onwards`;

  return `₹${price.toLocaleString("en-IN")} onwards`;
};

const text = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * All active projects, filtered from the URL (header "New Projects" menu):
 * ?launch_status=Under Construction &builder=DLF &city=Gurugram
 */
export default function ProjectList() {
  const router = useRouter();
  const filters = {
    launch_status: text(router.query.launch_status),
    builder: text(router.query.builder),
    city: text(router.query.city),
  };
  const filterKey = JSON.stringify(filters);
  const requestedPage = Math.max(1, parseInt(text(router.query.page), 10) || 1);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, last_page: 1, total: 0 });

  useEffect(() => {
    if (!router.isReady) return;

    let active = true;
    setLoading(true);

    getProjects(PER_PAGE, filters, requestedPage)
      .then((res) => {
        if (!active) return;
        const list = res?.data?.projects || [];
        setProjects(list);
        setPagination(res?.data?.pagination || { page: 1, last_page: 1, total: list.length });
        setFailed(false);
      })
      .catch(() => {
        if (!active) return;
        setProjects([]);
        setPagination({ page: 1, last_page: 1, total: 0 });
        setFailed(true);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, filterKey, requestedPage]);

  // Page change: same filters + ?page=N (page 1 = no param), back to the top
  const goToPage = (page) => {
    const query = { ...router.query };
    if (page > 1) query.page = String(page);
    else delete query.page;

    router.push({ pathname: router.pathname, query }, undefined, { scroll: false, shallow: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const firstShown = (pagination.page - 1) * PER_PAGE + 1;

  const stageLabel = PROJECT_STAGES.find((item) => item.value.toLowerCase() === filters.launch_status.toLowerCase())?.label;
  const builderLabel = PROJECT_DEVELOPERS.find((item) => item.value.toLowerCase() === filters.builder.toLowerCase())?.label || filters.builder;

  const title = [
    stageLabel || "New Projects",
    builderLabel && `by ${builderLabel}`,
    filters.city && `in ${filters.city}`,
  ].filter(Boolean).join(" ");

  // Removable chips for developer / city
  const chips = [
    filters.builder && { key: "builder", label: `Developer: ${builderLabel}` },
    filters.city && { key: "city", label: `City: ${filters.city}` },
  ].filter(Boolean);

  const chipClass = (active) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold no-underline transition ${
      active
        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
        : "border-gray-200 bg-white text-[var(--text-color1)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]"
    }`;

  return (
    <section className="container py-10">
      <h1 className="text-[28px] font-bold text-[var(--text-color1)]">{title}</h1>
      <p className="mb-6 text-[15px] text-[var(--text-color2)]">
        {loading
          ? "Loading projects..."
          : `${pagination.total} ${pagination.total === 1 ? "project" : "projects"} from trusted builders`}
      </p>

      {/* Stage filter */}
      <div className="mb-3 flex flex-wrap gap-2" aria-label="Project stage">
        <NextLink href={projectsHref({ ...filters, launch_status: "" })} className={chipClass(!filters.launch_status)}>
          All
        </NextLink>
        {PROJECT_STAGES.map((stage) => (
          <NextLink
            key={stage.value}
            href={projectsHref({ ...filters, launch_status: stage.value })}
            className={chipClass(stage.value.toLowerCase() === filters.launch_status.toLowerCase())}
          >
            {stage.label}
          </NextLink>
        ))}
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <NextLink
              key={chip.key}
              href={projectsHref({ ...filters, [chip.key]: "" })}
              aria-label={`Remove ${chip.label}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FFECD3] px-3 py-1 text-[13px] font-semibold text-[var(--primary-color)] no-underline hover:bg-orange-200"
            >
              {chip.label}
              <FiX size={13} />
            </NextLink>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-[280px] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : failed ? (
        <p className="py-16 text-center text-[var(--text-color2)]">Could not load projects. Please try again later.</p>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="mb-3 text-[var(--text-color2)]">No projects match these filters yet.</p>
          <NextLink href={projectsHref()} className="font-semibold text-[var(--primary-color)] no-underline">
            View all projects
          </NextLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <NextLink
              key={project.slug || project.id}
              href={`/web/project/projectDetail/${project.slug || project.id}`}
              className="group block overflow-hidden rounded-xl border border-gray-100 bg-white no-underline shadow-sm transition hover:shadow-md"
            >
              <div className="relative overflow-hidden">
                <img
                  src={project.image || FALLBACK_IMAGE}
                  onError={imageFallback(FALLBACK_IMAGE)}
                  alt={project.name || "Project"}
                  className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {project.launch_status && (
                  <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-color)] shadow-sm">
                    {project.launch_status}
                  </span>
                )}
              </div>

              <div className="p-4">
                {project.builder_name && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-color2)]">{project.builder_name}</p>
                )}
                <h3 className="text-[18px] font-bold text-[var(--text-color1)] transition-colors group-hover:text-[var(--primary-color)]">
                  {project.name}
                </h3>
                <p className="mb-0 mt-0.5 text-[13px] text-[var(--text-color2)]">
                  {[project.location, project.city].filter(Boolean).join(", ")}
                </p>
                {priceText(project) && (
                  <p className="mb-0 mt-2 text-[14px] font-bold text-[var(--primary-color)]">{priceText(project)}</p>
                )}
                {project.configuration && (
                  <p className="mb-0 mt-0.5 text-[11px] text-[var(--text-color2)]">{project.configuration}</p>
                )}
              </div>
            </NextLink>
          ))}
        </div>
      )}

      {!loading && !failed && pagination.last_page > 1 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="mb-0 text-sm text-[var(--text-color2)]">
            Showing {firstShown}–{firstShown + projects.length - 1} of {pagination.total} projects
          </p>
          <Pagination page={pagination.page} totalPages={pagination.last_page} onChange={goToPage} label="Project pages" />
        </div>
      )}
    </section>
  );
}
