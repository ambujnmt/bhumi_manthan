// Search engine text for public pages. Used by the admin form preview and the page itself,
// so the preview shows exactly what the page outputs.

export const SITE_NAME = "Bhoomi Manthan";
export const META_TITLE_LIMIT = 60;
export const META_DESCRIPTION_LIMIT = 160;

export const slugify = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const NAMED_ENTITIES = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

// Rich text (HTML) -> plain text. Done without the DOM because it also runs on the server.
const toPlainText = (html) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/g, (_, name) => NAMED_ENTITIES[name])
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const shorten = (text, limit) => {
  if (text.length <= limit) return text;

  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

const clean = (value) => String(value ?? "").trim();

const summarize = (html) => shorten(toPlainText(html), META_DESCRIPTION_LIMIT);

export function buildPropertySeo(property) {
  const title = clean(property?.title);
  const place = [property?.location, property?.city].filter(Boolean).join(", ");
  const heading = [title, place].filter(Boolean).join(" in ");

  return {
    title: clean(property?.meta_title) || (heading ? `${heading} | ${SITE_NAME}` : SITE_NAME),
    description: clean(property?.meta_description) || summarize(property?.description) || heading,
    keywords: clean(property?.meta_keywords),
  };
}

export function buildBlogSeo(blog) {
  const title = clean(blog?.title);

  return {
    title: clean(blog?.meta_title) || (title ? `${title} | ${SITE_NAME}` : SITE_NAME),
    description:
      clean(blog?.meta_description) ||
      summarize(blog?.excerpt) ||
      summarize(blog?.content) ||
      title,
    keywords: clean(blog?.meta_keywords),
  };
}
