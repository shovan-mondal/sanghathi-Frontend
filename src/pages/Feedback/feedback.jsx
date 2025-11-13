import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Box, Grid, Card, Stack, Typography, Divider } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, RHFTextField } from "../../components/hook-form";

const DEFAULT_VALUES = {
  issues: "",
  features: "",
  performance: "",
  feedback: "",
};

export default function FeedbackForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("menteeId") || user?._id;

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isEditable, setIsEditable] = useState(true);  // or false depending on logic
  const [existingFeedback, setExistingFeedback] = useState(null);

  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Optional: fetch existing feedback if any
  useEffect(() => {
    if (!targetUserId) return;
    const fetchFeedback = async () => {
      try {
        const resp = await api.get(`/feedback/${targetUserId}`);
        const data = resp.data;
        // assuming data has keys matching DEFAULT_VALUES
        reset({
          issues: data.issues || "",
          features: data.features || "",
          performance: data.performance || "",
          feedback: data.feedback || "",
        });
        setExistingFeedback(data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        // maybe show snackbar or ignore
      } finally {
        setIsDataFetched(true);
      }
    };
    fetchFeedback();
  }, [targetUserId, reset]);

  const onSubmit = async (formData) => {
    try {
      if (!targetUserId) {
        enqueueSnackbar("User ID is required", { variant: "error" });
        return;
      }

      const requestData = { ...formData, userId: targetUserId };

      // If existing feedback, use update; else create new
      let resp;
      if (existingFeedback && existingFeedback._id) {
        resp = await api.put(`/feedback/${existingFeedback._id}`, requestData);
      } else {
        resp = await api.post("/feedback", requestData);
      }

      enqueueSnackbar("Feedback saved successfully!", { variant: "success" });
      // optionally reset form or refetch
    } catch (error) {
      console.error("Error saving feedback:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred while saving feedback";
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  return (
    <div>
      <Box sx={{ mb: 2, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
        <Typography>Feedback Form</Typography>
      </Box>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>Feedback</Typography>
              <Divider sx={{ mb: 3 }} />

              {!isDataFetched ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography>Loading feedback...</Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="issues"
                      label="Did you encounter any usability issues?"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="features"
                      label="Were there any missing features you expected?"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="performance"
                      label="Did you experience any performance issues?"
                      fullWidth
                      
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="feedback"
                      label="Additional feedback"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                </Grid>
              )}
            </Card>
          </Grid>

          {isDataFetched && (
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={3} alignItems="flex-end">
                  {isEditable && (
                    <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                      Save Feedback
                    </LoadingButton>
                  )}
                </Stack>
              </Card>
            </Grid>
          )}
        </Grid>
      </FormProvider>
    </div>
  );
}
