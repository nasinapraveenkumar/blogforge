
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

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

function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const isDashboard = pathname.startsWith("/dashboard");
  const isMyPosts = pathname.startsWith("/my-posts");

  const isCreatePost =
    pathname.startsWith("/create-post") ||
    pathname.startsWith("/write");

  const isModeration = pathname.startsWith("/moderation");

  const hideNavbar =
    isDashboard ||
    isMyPosts ||
    isCreatePost ||
    isModeration;

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public article details */}
        <Route path="/posts/:slug" element={<Article />} />

        {/* Protected pages */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/my-posts"
            element={<MyPosts />}
          />

          <Route
            path="/create-post"
            element={<CreatePost />}
          />

          <Route
            path="/write"
            element={<CreatePost />}
          />

          <Route
            path="/moderation"
            element={<Moderation />}
          />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Home />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
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
