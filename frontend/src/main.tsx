import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { store } from "./store";
import { logout } from "./store/authSlice";
import { setOnAuthFailure } from "./lib/axios";
import App from "./App";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

// When a token refresh fails, drop the local session and send the user to login.
setOnAuthFailure(() => {
  store.dispatch(logout());
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          newestOnTop
          pauseOnFocusLoss={false}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
