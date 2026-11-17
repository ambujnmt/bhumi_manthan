// New projects listing page (header "New Projects" menu)
export const PROJECTS_PATH = "/web/project";

// Same values as projects.launch_status (admin project form)
export const PROJECT_STAGES = [
  { value: "New Launch", label: "New Launches" },
  { value: "Under Construction", label: "Under Construction" },
  { value: "Ready to Move", label: "Ready to Move" },
  { value: "Pre Launch", label: "Upcoming Projects" },
];

// builder = part of builder name ("DLF" matches "DLF LIMITED")
export const PROJECT_DEVELOPERS = [
  { value: "DLF", label: "DLF" },
  { value: "Godrej", label: "Godrej Properties" },
  { value: "M3M", label: "M3M India" },
];

export const PROJECT_CITIES = ["Gurugram", "Noida", "Bengaluru", "Mumbai"];

// { launch_status, builder, city } -> /web/project?launch_status=...
export const projectsHref = (filters = {}) => {
  const params = new URLSearchParams();

  ["launch_status", "builder", "city"].forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });

  const query = params.toString();
  return query ? `${PROJECTS_PATH}?${query}` : PROJECTS_PATH;
};
