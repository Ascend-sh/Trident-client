import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "./pages/auth";
import Servers from "./pages/user/servers";
import NotFound from "./pages/errors/404";
import Forbidden from "./pages/errors/403";
import AdminOverview from "./pages/admin/overview";
import AdminSoftware from "./pages/admin/software";
import AdminLocations from "./pages/admin/locations";
import Sidebar from "./components/navigation/sidebar";
import Header from "./components/navigation/header";
import GlobalLoader from "./components/loader/global-loader";
import { useAuth } from "./context/auth-context.jsx";

const AppLayout = () => {
  const [showLoader, setShowLoader] = useState(true);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setShowLoader(true);
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

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
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#091416" }} />
    );
  }
  if (status === "unauthenticated") return <Navigate to="/" replace />;
  return <Outlet />;
};

const RequireAdmin = () => {
  const { status, isAdmin } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#091416" }} />
    );
  }
  if (status === "unauthenticated") return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/forbidden" replace />;
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

            <Route element={<RequireAdmin />}>
              <Route path="/app/admin/overview" element={<AdminOverview />} />
              <Route path="/app/admin/software" element={<AdminSoftware />} />
              <Route path="/app/admin/locations" element={<AdminLocations />} />
            </Route>
          </Route>
        </Route>

        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
