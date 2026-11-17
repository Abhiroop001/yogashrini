import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Addproduct from "./pages/Addproduct";
import Listproduct from "./pages/Listproduct";
import Editproduct from "./pages/Editproduct";
import Addretreat from "./pages/Addretreat";
import Listretreat from "./pages/Listretreat";
import Editretreat from "./pages/Editretreat";
import Login from "./pages/Login";
import CourseList from "./pages/CourseList";
import AddCourse from "./pages/AddCourse";
import EditCourse from "./pages/EditCourse";
import ManageCourse from "./pages/ManageCourse";
import "./App.css";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem("uname");
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Executive Dashboard */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Curriculum & Courses */}
        <Route
          path="/courses"
          element={
            <PrivateRoute>
              <CourseList />
            </PrivateRoute>
          }
        />
        <Route
          path="/videos"
          element={
            <PrivateRoute>
              <CourseList />
            </PrivateRoute>
          }
        />
        <Route
          path="/addcourse"
          element={
            <PrivateRoute>
              <AddCourse />
            </PrivateRoute>
          }
        />
        <Route
          path="/editcourse/:id"
          element={
            <PrivateRoute>
              <EditCourse />
            </PrivateRoute>
          }
        />
        <Route
          path="/managecourse/:id"
          element={
            <PrivateRoute>
              <ManageCourse />
            </PrivateRoute>
          }
        />

        {/* Store & Services */}
        <Route
          path="/addproduct"
          element={
            <PrivateRoute>
              <Addproduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/listproduct"
          element={
            <PrivateRoute>
              <Listproduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/editproduct/:id"
          element={
            <PrivateRoute>
              <Editproduct />
            </PrivateRoute>
          }
        />

        {/* Sanctuaries & Retreats */}
        <Route
          path="/addretreat"
          element={
            <PrivateRoute>
              <Addretreat />
            </PrivateRoute>
          }
        />
        <Route
          path="/listretreat"
          element={
            <PrivateRoute>
              <Listretreat />
            </PrivateRoute>
          }
        />
        <Route
          path="/editretreat/:id"
          element={
            <PrivateRoute>
              <Editretreat />
            </PrivateRoute>
          }
        />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
