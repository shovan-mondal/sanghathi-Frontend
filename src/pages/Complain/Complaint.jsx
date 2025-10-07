import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Box, Grid, Card, Stack, Typography, Divider } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, RHFTextField } from "../../components/hook-form";

// Rename for complaints
const DEFAULT_VALUES = {
  complaintSubject: "",
  complaintDescription: "",
  complaintSeverity: "",
  additionalComments: "",
};

export default function ComplaintForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("menteeId") || user?._id;

  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [existingComplaint, setExistingComplaint] = useState(null);

  const methods = useForm({ defaultValues: DEFAULT_VALUES });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  // Fetch existing complaint if any
  useEffect(() => {
    if (!targetUserId) return;
    const fetchComplaint = async () => {
      try {
        const resp = await api.get(`/complaint/${targetUserId}`);
        const data = resp.data;
        reset({
          complaintSubject: data.complaintSubject || "",
          complaintDescription: data.complaintDescription || "",
          complaintSeverity: data.complaintSeverity || "",
          additionalComments: data.additionalComments || "",
        });
        setExistingComplaint(data);
      } catch (err) {
        console.error("Error fetching complaint:", err);
      } finally {
        setIsDataFetched(true);
      }
    };
    fetchComplaint();
  }, [targetUserId, reset]);

  const onSubmit = async (formData) => {
    try {
      if (!targetUserId) {
        enqueueSnackbar("User ID is required", { variant: "error" });
        return;
      }

      const requestData = { ...formData, userId: targetUserId };

      let resp;
      if (existingComplaint && existingComplaint._id) {
        resp = await api.put(`/complaint/${existingComplaint._id}`, requestData);
      } else {
        resp = await api.post("/complaint", requestData);
      }

      enqueueSnackbar("Complaint submitted successfully!", { variant: "success" });
    } catch (error) {
      console.error("Error submitting complaint:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred while submitting complaint";
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  return (
    <div>
      <Box sx={{ mb: 2, p: 2, bgcolor: "error.light", borderRadius: 1 }}>
        <Typography>Complaint Form</Typography>
      </Box>

      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>Submit a Complaint</Typography>
              <Divider sx={{ mb: 3 }} />

              {!isDataFetched ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography>Loading complaint data...</Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="complaintSubject"
                      label="Complaint Subject"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="complaintDescription"
                      label="Describe the issue"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="complaintSeverity"
                      label="Severity (Low, Medium, High)"
                      fullWidth
                      disabled={!isEditable}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <RHFTextField
                      name="additionalComments"
                      label="Additional comments (optional)"
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
                      Submit Complaint
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
