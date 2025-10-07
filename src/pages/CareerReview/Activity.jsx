import React, { useEffect, useState, useCallback, useContext } from "react";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useForm, useFieldArray } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { Box, Grid, Card, Stack, Button, IconButton, Typography, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { FormProvider, RHFTextField } from "../../components/hook-form";
import { useSearchParams } from "react-router-dom";

export default function Activity() {
    const [searchParams] = useSearchParams();
    const menteeId = searchParams.get('menteeId');

  const { enqueueSnackbar } = useSnackbar();
    const { user } = useContext(AuthContext);
    
    // Check if the current user is faculty
    const isFaculty = user?.roleName === "faculty";
    
    // Fields should be editable only if user is not faculty
    const isEditable = !isFaculty;
    
    console.log("User : ",user);
    console.log("id: ",menteeId);
    const methods = useForm({
      defaultValues: {
        activity: [{ eventType: "", eventTitle: "", description: "", eventDate: "" }],
      },
    });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: "activity",
    });

    const fetchActivity = useCallback(async () => {
      try {
        let response;
        if(menteeId)
          response = await api.get(`/activity-data/activity/${menteeId}`);
        else
          response = await api.get(`/activity-data/activity/${user._id}`);
        const { data } = response.data;
    
        if (data && Array.isArray(data.activity)) {
          const formattedActivity = data.activity.map((activity) => ({
            ...activity,
            eventDate: activity.eventDate ? new Date(activity.eventDate).toISOString().split("T")[0] : "",
          }));
          reset({ activity: formattedActivity });
        } else {
          console.warn("No activity data found for this user");
          reset({ activity: [{ eventType: "", eventTitle: "", description: "", eventDate: ""  }] });
        }
      } catch (error) {
        console.log("Error fetching activity data:", error);
      }
    }, [user._id, reset, enqueueSnackbar]);

    useEffect(() => {
      fetchActivity();
    }, [fetchActivity]);
  
    const handleReset = () => {
      reset();
    };
  
    const onSubmit = useCallback(
      async (formData) => {
        try {
          await api.post("/activity-data/activity", { activity: formData.activity, userId: user._id });
          enqueueSnackbar("Activity data updated successfully!", {
            variant: "success",
          });
          await fetchActivity();
        } catch (error) {
          console.error(error);
          enqueueSnackbar("An error occurred while processing the request", {
            variant: "error",
          });
        }
      },
      [enqueueSnackbar, fetchActivity, user._id]
    );

return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      {isFaculty && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body2" color="warning.dark">
            You are viewing this student profile in read-only mode. Only students can edit their own profiles.
          </Typography>
        </Box>
      )}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
            Event Participation Record in Sports, Cultural, Societal, etc by the Student
            </Typography>
            <Grid container spacing={2}>
              {fields.map((item, index) => (
                <Grid 
                  container 
                  spacing={2} 
                  key={item.id} 
                  alignItems="center" 
                  sx={{ mb: 1, mt: 1 }}
                  >
                  <Grid item xs={1}>
                    <TextField 
                    disabled 
                    value={index + 1} 
                    label="Sl. No." 
                    variant="outlined" 
                    />
                  </Grid>
                  <Grid item xs={2}>
                  <RHFTextField
                    name={`activity[${index}].eventType`} 
                    label="Event Type"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={3}>
                  <RHFTextField
                    name={`activity[${index}].eventTitle`} 
                    label="Event Title"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={3}>
                  <RHFTextField
                    name={`activity[${index}].description`} 
                    label="Description"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={2}>
                  <RHFTextField
                    name={`activity[${index}].eventDate`}
                    label="Event Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={1}>
                    {isEditable && (
                      <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 1 }}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}
                <Grid item xs={12}>
                  {isEditable && (
                    <Button 
                      variant="contained" 
                      onClick={() => append({ eventType: "", eventTitle: "", description: "", eventDate: "" })} 
                      sx={{ mt: 2, display: "block", mx: "auto" }}>
                      Add Activity
                    </Button>
                  )}
                </Grid>
        <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Box display="flex" gap={1}>
                {import.meta.env.MODE === "development" && isEditable && (
                  <LoadingButton 
                  variant="outlined" 
                  onClick={handleReset}>
                    Reset
                  </LoadingButton>
                )}
                {isEditable && (
                  <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                    Save
                  </LoadingButton>
                )}
              </Box>
            </Stack>
        </Grid>
      </Grid>
    </Card>
  </FormProvider>
  );
}