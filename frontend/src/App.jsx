
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

function AppLayout() {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/dashboard");
  const isMyPosts = location.pathname.startsWith("/my-posts");
  const isCreatePost = location.pathname.startsWith("/create-post");

  const hideNavbar = isDashboard || isMyPosts || isCreatePost;

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/create-post" element={<CreatePost />} />
        </Route>

        {/* Redirect unknown URLs to the home page */}
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
