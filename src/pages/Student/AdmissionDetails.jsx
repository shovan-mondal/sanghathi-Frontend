import React, { useState, useEffect, useContext, useCallback } from "react";
import { useSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axios";
import { useForm } from "react-hook-form";
import {
  Box,
  Grid,
  Card,
  Stack,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  FormProvider,
  RHFTextField,
  RHFSelect,
} from "../../components/hook-form";

const DEFAULT_VALUES = {
  admissionYear: "",
  branch: "",
  admissionType: "",
  category: "",
  collegeId: "",
  branchChange: {
    year: "",
    branch: "",
    usn: "",
    collegeId: "",
  },
  documentsSubmitted: [],
};

export default function AdmissionDetails() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get("menteeId");
  const [isDataFetched, setIsDataFetched] = useState(false);

  const methods = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;
  const documentsSubmitted = watch("documentsSubmitted");

  const fetchAdmissionDetails = useCallback(async () => {
    try {
      const userId = menteeId || user?._id;
      if (!userId) return;

      const admissionResponse = await api.get(`/v1/admissions/${userId}`);
      const admissionData = admissionResponse.data.data?.admissionDetails;

      if (admissionData) {
        Object.keys(DEFAULT_VALUES).forEach((key) => {
          if (key === "documentsSubmitted") {
            setValue(key, admissionData[key] || []);
          } else if (
            typeof admissionData[key] === "object" &&
            admissionData[key] !== null
          ) {
            Object.keys(admissionData[key]).forEach((subKey) => {
              setValue(`${key}.${subKey}`, admissionData[key][subKey] || "");
            });
          } else {
            setValue(key, admissionData[key] || "");
          }
        });
      }
    } catch (error) {
      // if (error.response?.status !== 404) {
        console.error("Error fetching academic details:", error);
        // enqueueSnackbar("Error fetching admission details", {
        //   variant: "error",
      //   // });
      // }
    } finally {
      setIsDataFetched(true);
    }
  }, [menteeId, user?._id, setValue, enqueueSnackbar]);

  useEffect(() => {
    fetchAdmissionDetails();
  }, [fetchAdmissionDetails]);

  const onSubmit = async (data) => {
    try {
      // Clean up empty strings and null values
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (key === 'branchChange') {
          // Handle branchChange object
          acc[key] = Object.entries(value).reduce((branchAcc, [branchKey, branchValue]) => {
            if (branchValue !== null && branchValue !== '') {
              branchAcc[branchKey] = branchValue;
            }
            return branchAcc;
          }, {});
        } else if (key === 'documentsSubmitted') {
          // Keep documentsSubmitted array as is
          acc[key] = value;
        } else if (value !== null && value !== '') {
          // Keep non-empty values
          acc[key] = value;
        }
        return acc;
      }, {});

      const payload = {
        ...cleanedData,
        userId: menteeId || user?._id,
      };

      const response = await api.post("/v1/admissions", payload);
      enqueueSnackbar("Admission details saved successfully!", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving admission details:", error);
      enqueueSnackbar(error.response?.data?.message || "Failed to save admission details.", {
        variant: "error",
      });
    }
  };

  const documentsList = [
    "SSLC/X Marks Card",
    "PUC/XII Marks Card",
    "Caste Certificate",
    "Migration Certificate",
  ];

  return (
    <div>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Admission Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  display: "grid",
                  rowGap: 3,
                  columnGap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                  },
                }}
              >
                <RHFTextField name="admissionYear" label="Admission Year" />
                <RHFTextField name="branch" label="Branch" />
                <RHFSelect name="admissionType" label="Type of Admission">
                  <option value="" />
                  {["COMEDK", "CET", "MANAGEMENT", "SNQ"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </RHFSelect>
                <RHFTextField name="category" label="Category" />
                <RHFTextField name="collegeId" label="College ID Number" />
              </Box>

              <Typography variant="h6" sx={{ mt: 3 }}>
                change of Branch (if applicable)
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  display: "grid",
                  rowGap: 3,
                  columnGap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                  },
                }}
              >
                <RHFTextField name="branchChange.year" label="Year of Change" />
                <RHFTextField name="branchChange.branch" label="New Branch" />
                <RHFTextField name="branchChange.usn" label="New USN" />
                <RHFTextField
                  name="branchChange.collegeId"
                  label="New College ID"
                />
              </Box>

              <Typography variant="h6" sx={{ mt: 3 }}>
                Documents Submitted
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <FormControl component="fieldset">
                <FormGroup>
                  {documentsList.map((doc) => (
                    <FormControlLabel
                      key={doc}
                      control={
                        <Checkbox
                          checked={documentsSubmitted.includes(doc)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updatedDocs = checked
                              ? [...(documentsSubmitted || []), doc]
                              : documentsSubmitted.filter(
                                  (item) => item !== doc
                                );
                            setValue("documentsSubmitted", updatedDocs);
                          }}
                        />
                      }
                      label={doc}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                >
                  Save Changes
                </LoadingButton>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </FormProvider>
    </div>
  );
}
