import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { StudioApp } from "./StudioApp.jsx";
import "./styles.css";
import "./studio.css";

const RootApp = window.location.pathname.startsWith("/studio") ? StudioApp : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
