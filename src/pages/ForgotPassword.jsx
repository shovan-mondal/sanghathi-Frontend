import { useState } from "react";
import { Box, Button, Container, TextField, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import Page from "../components/Page";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
    await axios.post(`${import.meta.env.VITE_API_URL}/users/forgotPassword`, { email });
      enqueueSnackbar("Password reset link sent to your email!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Something went wrong", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Forgot Password">
      <Container maxWidth="sm">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <Typography variant="h4" align="center">Forgot Password</Typography>
          <Typography variant="body1" align="center">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </Box>
      </Container>
    </Page>
  );
};


export default ForgotPassword;
