import { createBrowserRouter } from "react-router";
import { contextPath } from "utils/contextPath";
import { getRoutes } from "./routes";

export const router = createBrowserRouter(getRoutes(), {
  basename: contextPath || "/",
});
