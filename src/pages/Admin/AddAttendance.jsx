import { useState } from "react";
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Container,
  Paper,
  Stack,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { 
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { alpha, useTheme } from "@mui/material/styles";
import Papa from "papaparse";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const AddAttendance = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);

  // Month mapping - handles both full names and abbreviations
  const monthMap = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  // Helper function to get month value
  const getMonthValue = (monthInput) => {
    if (!monthInput) return undefined;
    const normalizedMonth = monthInput.toString().toLowerCase().trim();
    return monthMap[normalizedMonth];
  };


  const downloadTemplate = () => {
    const headers = [
      "USN",
      "Sem",
      "Month",
      "Mathematics Code",
      "Mathematics",
      "Mathematics Total",
      "Science Code",
      "Science",
      "Science Total",
    ];
    const csvContent = Papa.unparse([headers], { quotes: true });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "attendance_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setFile(file);
    setProcessing(true);
    setErrors([]);
    setSuccessCount(0);
    setErrorCount(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      let rows = [];
      if (file.type === "application/json") {
        rows = JSON.parse(content);
      } else {
        const results = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
        });
        rows = results.data;
      }
      await processRows(rows);
    };
    reader.readAsText(file);
  };

  const processRows = async (rows) => {
    let success = 0;
    let errors = 0;
    const newErrors = [];

    for (const [index, row] of rows.entries()) {
      try {
        console.log(`Processing row ${index + 1}:`, row);
        
        // Trim all values and check for required fields
        const usn = row.USN?.toString().trim();
        const sem = row.Sem?.toString().trim();
        const month = row.Month?.toString().trim();
        
        if (!usn) {
          throw new Error("Missing USN");
        }
        if (!sem) {
          throw new Error("Missing Sem (Semester)");
        }
        if (!month) {
          throw new Error("Missing Month");
        }

        // Convert month name to number using case-insensitive matching
        const monthValue = getMonthValue(month);
        if (monthValue === undefined) {
          throw new Error(`Invalid month: ${month}. Use month names like January, Jan, February, Feb, etc.`);
        }

        const subjects = [];
        const headers = Object.keys(row).filter(
          (key) => key !== "USN" && key !== "Sem" && key !== "Month"
        );

        // Process subjects in groups of 3 (code, name, total)
        for (let i = 0; i < headers.length; i += 3) {
          const subjectCodeHeader = headers[i];
          const subjectHeader = headers[i + 1];
          const totalHeader = headers[i + 2];
          
          if (!totalHeader || !totalHeader.endsWith(" Total")) {
            throw new Error(`Invalid subject columns at ${subjectHeader}`);
          }
          
          const subjectName = subjectHeader.replace(" Total", "");
          const subjectCode = row[subjectCodeHeader]?.toString().trim();
          const attended = parseInt(row[subjectHeader], 10);
          const total = parseInt(row[totalHeader], 10);
          
          if (!subjectCode) {
            throw new Error(`Missing subject code for ${subjectName}`);
          }
          
          if (isNaN(attended) || isNaN(total)) {
            throw new Error(`Invalid numbers for ${subjectName}`);
          }
          
          subjects.push({
            subjectCode,
            subjectName,
            attendedClasses: attended,
            totalClasses: total,
          });
        }

        const response = await axios.get(`${BASE_URL}/users/usn/${usn}`);
        console.log("User lookup response: ", response);
        if (!response.data?.userId) {
          throw new Error(`User not found`);
        }
        const userId = response.data.userId;
        console.log("UserId: ", userId);

        const attendanceData = {
          semester: parseInt(sem, 10),
          month: monthValue,
          subjects,
        };
        console.log("Attendance Data to send: ", attendanceData);

        try {
          await axios.post(`${BASE_URL}/students/attendance/${userId}`, attendanceData);
          success++;
        } catch (postError) {
          console.error("Post error details:", postError.response?.data);
          const errorMessage = postError.response?.data?.message || 
                             postError.response?.data?.error || 
                             postError.message || 
                             'Unknown error occurred';
          throw new Error(`Failed to save attendance: ${errorMessage}`);
        }
      } catch (error) {
        errors++;
        newErrors.push(`USN: ${row.USN || 'Unknown'} - ${error.message}`);
        console.error(`Error processing row ${index + 1}:`, error);
      }
    }

    setSuccessCount(success);
    setErrorCount(errors);
    setErrors(newErrors);
    setProcessing(false);
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: isLight 
            ? 'rgba(255, 255, 255, 0.8)'
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          boxShadow: isLight
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          mb: 4
        }}
      >
        <Box 
          sx={{ 
            textAlign: 'center',
            mb: 4
          }}
        >
          <Typography 
            variant="h4"
            sx={{
              fontWeight: 'bold',
              background: isLight 
                ? `-webkit-linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : `-webkit-linear-gradient(45deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Upload Attendance
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload student attendance data in bulk using CSV format
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: isLight 
              ? alpha(theme.palette.primary.main, 0.04)
              : alpha(theme.palette.info.main, 0.08),
            p: 3,
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            CSV File Requirements
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The CSV file should contain the following columns:
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              mb: 3,
              pl: 2,
              borderLeft: `4px solid ${isLight ? theme.palette.primary.main : theme.palette.info.main}`,
              py: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">• USN - Student's USN (required)</Typography>
            <Typography variant="body2" color="text.secondary">• Sem - Semester number (required)</Typography>
            <Typography variant="body2" color="text.secondary">• Month - Month name: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec(required)</Typography>
            <Typography variant="body2" color="text.secondary">• Subject Code - For each subject</Typography>
            <Typography variant="body2" color="text.secondary">• Subject Name - For each subject</Typography>
            <Typography variant="body2" color="text.secondary">• Subject Name Total - Total classes for each subject</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>Important:</strong> For each subject, you need three columns: one for subject code, one for subject name, and one for total classes.
            For example, "Mathematics Code", "Mathematics", and "Mathematics Total".
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Month values:</strong>Use specific month abbreviations (Jan, Feb, etc.)
            </Typography>
          </Alert>

          <Divider sx={{ my: 3 }} />

          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Button 
              variant="outlined" 
              onClick={downloadTemplate}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: '8px',
                py: 1.2,
                px: 3,
                width: { xs: '100%', sm: 'auto' },
                borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                color: isLight ? theme.palette.primary.main : theme.palette.info.main,
                '&:hover': {
                  borderColor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                  backgroundColor: isLight 
                    ? alpha(theme.palette.primary.main, 0.04)
                    : alpha(theme.palette.info.main, 0.08),
                }
              }}
            >
              Download Template
            </Button>
            
            <Box
              sx={{
                position: 'relative',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              <input
                accept=".csv,.json"
                style={{ display: 'none' }}
                id="upload-file"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="upload-file">
                <Button 
                  variant="contained" 
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={processing}
                  sx={{
                    borderRadius: '8px',
                    py: 1.2,
                    px: 3,
                    width: { xs: '100%', sm: 'auto' },
                    position: 'relative',
                    bgcolor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                    '&:hover': {
                      bgcolor: isLight 
                        ? theme.palette.primary.dark
                        : theme.palette.info.dark,
                    }
                  }}
                >
                  {processing ? (
                    <>
                      <CircularProgress
                        size={24}
                        thickness={4}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                          color: 'white',
                        }}
                      />
                      Processing...
                    </>
                  ) : (
                    `${file ? 'File Selected' : 'Upload Attendance'}`
                  )}
                </Button>
              </label>
            </Box>
          </Stack>
        </Box>

        {!processing && (successCount > 0 || errorCount > 0) && (
          <Box sx={{ mt: 3 }}>
            {successCount > 0 && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                Successfully processed: {successCount} student record(s)
              </Alert>
            )}
            
            {errorCount > 0 && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                Errors encountered: {errorCount} record(s)
              </Alert>
            )}
            
            {errors.length > 0 && (
              <Box 
                sx={{ 
                  mt: 2,
                  backgroundColor: isLight 
                    ? alpha(theme.palette.error.main, 0.05)
                    : alpha(theme.palette.error.dark, 0.1),
                  borderRadius: 2,
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Error Details:</Typography>
                <List dense>
                  {errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={error}
                        primaryTypographyProps={{ 
                          variant: 'body2', 
                          color: 'error.main' 
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        <Paper 
          elevation={1} 
          sx={{ 
            p: 2,
            mt: 4,
            backgroundColor: isLight 
              ? alpha(theme.palette.warning.main, 0.05)
              : alpha(theme.palette.warning.dark, 0.05),
            border: `1px dashed ${alpha(theme.palette.warning.main, 0.2)}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <HelpOutlineIcon 
            fontSize="small" 
            color="warning" 
            sx={{ flexShrink: 0 }}
          />
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Subjects must have matching "Total" columns (e.g., "Mathematics" and "Mathematics Total").
            Attendance is tracked per semester, per month.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddAttendance;