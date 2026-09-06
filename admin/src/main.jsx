import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App.jsx";
import "./index.css";
// import "./Styles/app.scss";
import { Provider } from "react-redux";
import store from "./store/store.js";

axios.defaults.withCredentials = true;
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
