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


export default function Mooc() {
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
        mooc: [{ portal: "", title: "", startDate: null, completedDate: null, score: null, certificateLink: "" }],
      },
    });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
    const { fields, append, remove } = useFieldArray({
      control: methods.control,
      name: "mooc",
    });

    const fetchMooc = useCallback(async () => {
      try {
        let response;
        if(menteeId)
          response = await api.get(`/mooc-data/mooc/${menteeId}`);
        else
          response = await api.get(`/mooc-data/mooc/${user._id}`);
        const { data } = response.data;
    
        if (data && Array.isArray(data.mooc)) {
          const formattedMooc = data.mooc.map((mooc) => ({
            ...mooc,
            startDate: mooc.startDate ? new Date(mooc.startDate).toISOString().split("T")[0] : "",
            completedDate: mooc.completedDate ? new Date(mooc.completedDate).toISOString().split("T")[0] : "",
          }));
          reset({ mooc: formattedMooc });
        } else {
          console.warn("No mooc data found for this user");
          reset({ mooc: [{ portal: "", title: "", startDate: null, completedDate: null, score: null, certificateLink: "" }] });
        }
      } catch (error) {
        console.log("Error fetching mooc data:", error);
      }
    }, [user._id, reset, enqueueSnackbar]);

    useEffect(() => {
      fetchMooc();
    }, [fetchMooc]);
  
    const handleReset = () => {
      reset();
    };
  
    const onSubmit = useCallback(
      async (formData) => {
        try {
          await api.post("/mooc-data/mooc", { mooc: formData.mooc, userId: user._id });
          enqueueSnackbar("Mooc data updated successfully!", {
            variant: "success",
          });
          await fetchMooc();
        } catch (error) {
          console.error(error);
          enqueueSnackbar("An error occurred while processing the request", {
            variant: "error",
          });
        }
      },
      [enqueueSnackbar, fetchMooc, user._id]
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
                    name={`mooc[${index}].portal`} 
                    label="Course Portal"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={3}>
                  <RHFTextField
                    name={`mooc[${index}].title`} 
                    label="Mooc Title"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={2}>
                  <RHFTextField
                    name={`mooc[${index}].startDate`}
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
                    name={`mooc[${index}].completedDate`}
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
                  <Grid item xs={2}>
                  <RHFTextField
                    name={`mooc[${index}].score`} 
                    label="Score"
                    fullWidth
                    disabled={!isEditable}
                    InputProps={{
                      readOnly: !isEditable,
                    }}
                  />
                  </Grid>
                  <Grid item xs={5}>
                  <RHFTextField
                    name={`mooc[${index}].certificateLink`} 
                    label="Certificate Link"
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
                      onClick={() => append({ portal: "", title: "", startDate: null, completedDate: null, score: null, certificateLink: "" })} 
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
