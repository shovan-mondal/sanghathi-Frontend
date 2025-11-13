import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Container, TextField, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import Page from "../components/Page";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/users/resetPassword/${token}`, {
        password,
        passwordConfirm,
      });

      enqueueSnackbar("Password reset successful. Please login.", { variant: "success" });
      navigate("/login");
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to reset password", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Reset Password">
      <Container maxWidth="sm">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Typography variant="h4" align="center">Reset Password</Typography>

          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Confirm New Password"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </Box>
      </Container>
    </Page>
  );
};

export default ResetPassword;