import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

function ProtectedRouteWrapper({ children, allowedRoles, ...props }) {
  const { user, isFetching } = useContext(AuthContext); // Get the user and loading state from context

  // Show loading spinner while fetching user data
  if (isFetching) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified and user doesn't have the role, show unauthorized page
  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <h1>Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <p>Required role: {allowedRoles.join(", ")}</p>
        <p>Your role: {user.roleName}</p>
      </Box>
    );
  }

  return <>{children}</>;
}

export default ProtectedRouteWrapper;
