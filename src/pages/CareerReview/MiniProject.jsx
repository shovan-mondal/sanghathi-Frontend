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

export default function MiniProject() {
  const { enqueueSnackbar } = useSnackbar();
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const menteeId = searchParams.get('menteeId');
    
    // Check if the current user is faculty
    const isFaculty = user?.roleName === "faculty";
    
    // Fields should be editable only if user is not faculty
    const isEditable = !isFaculty;
    
    console.log("User : ",user);
    console.log("id: ",menteeId);
    
    const methods = useForm({
      defaultValues: {
        miniproject: [{ title: "",manHours: "",startDate: null,completedDate: null, }],
      },
    });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: "miniproject",
    });

    const fetchMiniProjects = useCallback(async () => {
      try {
        let response;
        if(menteeId)
          response = await api.get(`/project/miniproject/${menteeId}`);
        else
          response = await api.get(`/project/miniproject/${user._id}`);
        console.log("Raw API Response:", response.data);
        const { data } = response.data;
    
        if (data && Array.isArray(data.miniproject)) {
          const formattedMiniProject = data.miniproject.map((miniproject) => ({
            ...miniproject,
            startDate: miniproject.startDate ? new Date(miniproject.startDate).toISOString().split("T")[0] : "",
            completedDate: miniproject.completedDate ? new Date(miniproject.completedDate).toISOString().split("T")[0] : "",
          }));
          console.log("Formatted miniproject:", formattedMiniProject); 
          reset({ miniproject: formattedMiniProject });
        } else {
          console.warn("No miniproject data found for this user");
          reset({ miniproject: [{ title: "",manHours: "",startDate: null,completedDate: null,  }] });
        }
      } catch (error) {
        console.log("Error fetching miniproject data:", error);
      }
    }, [user._id, reset, enqueueSnackbar]);
    
    useEffect(() => {
      fetchMiniProjects();
    }, [fetchMiniProjects]);
  
    const handleReset = () => {
      reset();
    };
  
    const onSubmit = useCallback(
      async (formData) => {
        try {
          await api.post("/project/miniproject", { miniproject: formData.miniproject, userId: user._id });
          enqueueSnackbar("miniproject data updated successfully!", {
            variant: "success",
          });
          await fetchMiniProjects();
        } catch (error) {
          console.error(error);
          enqueueSnackbar("An error occurred while processing the request", {
            variant: "error",
          });
        }
      },
      [enqueueSnackbar, fetchMiniProjects, user._id]
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
            <Grid item xs={3}>
              <RHFTextField
                name={`miniproject[${index}].title`} 
                label="Miniproject Title"
                fullWidth
                disabled={!isEditable}
                InputProps={{
                  readOnly: !isEditable,
                }}
              />
            </Grid>
            <Grid item xs={3}>
              <RHFTextField
                name={`miniproject[${index}].manHours`} 
                label="Man Hours"
                fullWidth
                disabled={!isEditable}
                InputProps={{
                  readOnly: !isEditable,
                }}
              />
            </Grid>
            <Grid item xs={2}>
            <RHFTextField
              name={`miniproject[${index}].startDate`}
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={!isEditable}
              InputProps={{
                readOnly: !isEditable,
              }}
            />
            </Grid>
            <Grid item xs={2}>
            <RHFTextField
              name={`miniproject[${index}].completedDate`}
              label="Completed Date"
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
                onClick={() => append({  title: "",manHours: "",startDate: null,completedDate: null, })} 
                sx={{ mt: 2, display: "block", mx: "auto" }}>
                Add Row
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
