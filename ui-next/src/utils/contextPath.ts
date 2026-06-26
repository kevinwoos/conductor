const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, "");

export const contextPath = (() => {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalized = trimTrailingSlash(baseUrl);

  return normalized === "" ? "" : normalized;
})();

export const withContextPath = (path: string) => {
  const normalizedPath = `/${trimLeadingSlash(path)}`;

  return `${contextPath}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1");
};

export const appOrigin = () => `${window.location.origin}${contextPath}`;

export const apiBaseUrl = () => `${window.location.origin}${withContextPath("/api")}`;
