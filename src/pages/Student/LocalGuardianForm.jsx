import { useEffect, useState, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import { Box, Grid, Card, Stack, Typography, Divider } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import { AuthContext } from "../../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/axios";

const DEFAULT_VALUES = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  relationWithGuardian: "",
  mobileNumber: "",
  phoneNumber: "",
  residenceAddress: "",
  taluka: "",
  district: "",
  state: "",
  pincode: "",
};

export default function LocalGuardianForm() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get("menteeId");
  const [isDataFetched, setIsDataFetched] = useState(false);

  // Faculty read-only check
  const isFaculty = user?.roleName === "faculty";
  const isEditable = !isFaculty;

  const methods = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const fetchLocalGuardian = useCallback(async () => {
    try {
      const userId = menteeId || user?._id;
      if (!userId) return;

      const response = await api.get(`/v1/local-guardians/${userId}`);

      if (response.data.status === "success") {
        if (response.data.data?.localGuardian) {
          reset(response.data.data.localGuardian);
        } else {
          reset(DEFAULT_VALUES);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        reset(DEFAULT_VALUES);
      } else {
        enqueueSnackbar("Error fetching guardian details", {
          variant: "error",
        });
      }
    } finally {
      setIsDataFetched(true);
    }
  }, [menteeId, user, reset, enqueueSnackbar]);

  useEffect(() => {
    fetchLocalGuardian();
  }, [fetchLocalGuardian]);

  const onSubmit = async (data) => {
    try {
      const userId = menteeId || user?._id;
      if (!userId) {
        enqueueSnackbar("User ID is required", { variant: "error" });
        return;
      }

      await api.post("/v1/local-guardians", { ...data, userId });
      enqueueSnackbar("Guardian details saved successfully!", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Error saving guardian details",
        { variant: "error" }
      );
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      {isFaculty && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "warning.light", borderRadius: 1 }}>
          <Typography variant="body2" color="warning.dark">
            You are viewing this student profile in read-only mode. Only
            students can edit their own profiles.
          </Typography>
        </Box>
      )}

      <Card sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Local Guardian Details
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {!isDataFetched ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography>Loading guardian details...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <RHFTextField
                name="firstName"
                label="First Name"
                fullWidth
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <RHFTextField
                name="middleName"
                label="Middle Name"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <RHFTextField
                name="lastName"
                label="Last Name"
                fullWidth
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <RHFTextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="relationWithGuardian"
                label="Relation with Guardian"
                fullWidth
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <RHFTextField
                name="mobileNumber"
                label="Mobile Number"
                type="tel"
                fullWidth
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="phoneNumber"
                label="Phone Number"
                type="tel"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>

            <Grid item xs={12}>
              <RHFTextField
                name="residenceAddress"
                label="Residence Address"
                fullWidth
                multiline
                rows={3}
                required
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <RHFTextField
                name="taluka"
                label="Taluka"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <RHFTextField
                name="district"
                label="District"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <RHFTextField
                name="state"
                label="State"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <RHFTextField
                name="pincode"
                label="Pincode"
                fullWidth
                disabled={!isEditable}
                InputProps={{ readOnly: !isEditable }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack spacing={2} direction="row" justifyContent="flex-end">
                <LoadingButton
                  variant="outlined"
                  onClick={() => reset(DEFAULT_VALUES)}
                  disabled={isSubmitting || !isEditable}
                >
                  Reset
                </LoadingButton>
                {isEditable && (
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                  >
                    Save
                  </LoadingButton>
                )}
              </Stack>
            </Grid>
          </Grid>
        )}
      </Card>
    </FormProvider>
  );
}
