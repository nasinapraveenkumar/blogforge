
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import api from "./services/api";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import MyPosts from "./pages/MyPosts";
import CreatePost from "./pages/CreatePost";
import Moderation from "./pages/Moderation";
import Article from "./pages/Article";
import Bookmarks from "./pages/Bookmarks";
import DashboardLayout from "./layouts/DashboardLayout";
import WorkspacePlaceholder from "./components/WorkspacePlaceholder";

import Explore from "./pages/Explore";
import Reports from "./pages/Reports";
import MyReports from "./pages/MyReports";
import ProfileSettings from "./pages/ProfileSettings";
import Community from "./pages/Community";
import AdminDashboard from "./pages/AdminDashboard";

function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        await api.get("/auth/me");

        if (active) {
          setAuthenticated(true);
        }
      } catch {
        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/explore" ||
    pathname === "/community" ||
    pathname.startsWith("/posts/");

  // Show the public navbar on public pages regardless of login status.
  const showMainNavbar = isPublicPage && !checkingSession;

  return (
    <>
      {showMainNavbar && <Navbar />}

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/posts/:slug" element={<Article />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/community" element={<Community />} />

        {/* Protected workspace */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/write" element={<CreatePost />} />
            <Route path="/edit-post/:id" element={<CreatePost />} />

            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/my-reports" element={<MyReports />} />

            <Route
              path="/messages"
              element={
                <WorkspacePlaceholder
                  title="Messages"
                  description="Your conversations will appear here when messaging functionality is implemented."
                />
              }
            />
          </Route>

          {/* Moderation pages */}
          <Route path="/moderation" element={<Moderation />} />
          <Route path="/reports" element={<Reports />} />

          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
