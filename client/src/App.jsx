import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "./pages/auth";
import Servers from "./pages/user/servers";
import NotFound from "./pages/errors/404";
import Sidebar from "./components/navigation/sidebar";
import Header from "./components/navigation/header";
import GlobalLoader from "./components/loader/global-loader";
import { account } from "./utils/auth";

const AppLayout = () => {
  const [showLoader, setShowLoader] = useState(true);

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#091416" }}>
      {showLoader && <GlobalLoader onLoadingComplete={() => setShowLoader(false)} />}
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RequireAuth = () => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    account()
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("unauthorized");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#091416" }} />
    );
  }
  if (status === "unauthorized") return <Navigate to="/" replace />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/app/home" element={<Servers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
