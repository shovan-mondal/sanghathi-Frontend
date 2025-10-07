import { useState, useContext } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Papa from "papaparse";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha, useTheme } from "@mui/material/styles";
const BASE_URL = import.meta.env.VITE_API_URL;

const AddMarks = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const token = localStorage.getItem("token");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const downloadTemplate = () => {
    // Create CSV content
    const headers = ["Semester", "USN"];
    for (let i = 1; i <= 2; i++) {
      headers.push(`Subject Code ${i}`, `Subject Name ${i}`, `Internal Marks ${i}`, `External Marks ${i}`, `Total ${i}`, `Attempt ${i}`, `Result ${i}`);
    }
    headers.push(`Passing Date`);
    headers.push(`sgpa`);
    const csvContent = [headers.join(',')];
    const row1 = [];
    csvContent.push(row1.join(','));
  
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'external_marks_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);  
    window.URL.revokeObjectURL(url);  
  };
  
  const processCSV = (csvData) => {
  const studentsData = [];

  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row.length >= 2 && row[0] && row[1]) {
      const semester = parseInt(row[0]);
      const usn = row[1].trim().toUpperCase();
      const subjects = [];

      // Last two fields are Passing Date and SGPA
      const passingDate = row[row.length - 2]?.trim();
      const sgpa = parseFloat(row[row.length - 1]);

      for (let j = 2; j < row.length - 2; j += 7) {
        const [code, name, internal, external, total, attempt, result] = row.slice(j, j + 7);
        if (code && name && internal && external && total && attempt && result) {
          const internalMarks = parseInt(internal);
          const externalMarks = parseInt(external);
          const totalMarks = parseInt(total);
          const attemptNo = parseInt(attempt);
          const resultStatus = result.toUpperCase();

          if (!isNaN(internalMarks) && !isNaN(externalMarks) && !isNaN(totalMarks) && !isNaN(attemptNo) && (resultStatus === "P" || resultStatus === "F")) {
            subjects.push({
              subjectCode: code,
              subjectName: name,
              internalMarks,
              externalMarks,
              total: totalMarks,
              attempt: attemptNo,
              result: resultStatus === "P" ? "PASS" : "FAIL"
            });
          }
        }
      }

      if (subjects.length > 0) {
        studentsData.push({
          semester,
          usn,
          subjects,
          passingDate,
          sgpa
        });
      }
    }
  }

  // Group by USN
  const studentGroups = new Map();
  for (const student of studentsData) {
    if (!studentGroups.has(student.usn)) {
      studentGroups.set(student.usn, []);
    }
    studentGroups.get(student.usn).push({
      semester: student.semester,
      subjects: student.subjects,
      passingDate: student.passingDate,
      sgpa: student.sgpa
    });
  }

  return studentGroups;
};

  // Function to look up a student's userId by their USN
  const fetchUserIdByUSN = async (usn) => {
    try {
      // Call the API to get user ID from USN
      const response = await axios.get(`${BASE_URL}/users/usn/${usn}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.userId) {
        return response.data.userId;
      } else {
        console.error(`No userId found for USN: ${usn}`);
        return null;
      }
    } catch (error) {
      console.error(`Error looking up userId for USN ${usn}:`, error.response?.data || error.message);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!file) {
      setError("Please select a CSV file");
      setLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const parsedData = Papa.parse(csvText).data;
          const studentGroups = processCSV(parsedData);  

          // Create an array to track results for each student
          const results = [];
          
          // Process each student
          for (const [usn, semesterGroups] of studentGroups) {
            try {
              // First look up student ID by USN
              console.log(`Looking up student with USN: ${usn}`);
              
              let studentId = null;
              try {
                console.log(`Making API call to fetch user ID for USN: ${usn}`);
                studentId = await fetchUserIdByUSN(usn);
                console.log(`Result of user lookup for USN ${usn}:`, studentId ? `Found: ${studentId}` : "Not found");
              } catch (lookupError) {
                console.error(`Error looking up student with USN ${usn}:`, lookupError);
              }
              
              // If lookup failed, fall back to admin ID
              if (!studentId) {
                console.warn(`Could not find userId for USN ${usn}, falling back to admin ID: ${user._id}`);
                studentId = user._id;
              }
              
              // Submit data for each semester
              for (const semesterData of semesterGroups) {
                const { semester, subjects } = semesterData;
                if (subjects && subjects.length > 0) {
                  console.log(`Submitting semester ${semester} data for USN ${usn}:`, subjects);
                  
                  const formattedSubjects = subjects.map(subject => ({
                    subjectCode: subject.subjectCode,
                    subjectName: subject.subjectName,
                    internalMarks: subject.internalMarks,
                    externalMarks: subject.externalMarks,
                    total: subject.total,
                    attempt: subject.attempt,
                    result: subject.result
                  }));
                  await axios.post(
                    `${BASE_URL}/students/external/${studentId}`,
                    {
                      semester,
                      subjects: formattedSubjects,
                      passingDate: semesterData.passingDate,
                      sgpa: semesterData.sgpa
                    },
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );
                }
              }
              
              // Add success result for this student
              results.push({ usn, status: 'success' });
            } catch (error) {
              // Add failure result for this student
              results.push({ 
                usn, 
                status: 'error', 
                message: error.response?.data?.message || error.message
              });
              console.error(`Error processing student ${usn}:`, error);
            }
          }
          
          // Show summary results
          const successCount = results.filter(r => r.status === 'success').length;
          const totalCount = results.length;
          
          if (successCount === totalCount) {
            setSuccess(`All ${totalCount} students processed successfully!`);
          } else {
            setSuccess(`Processed ${successCount} out of ${totalCount} students successfully.`);
            setError(`Failed to process ${totalCount - successCount} students. See console for details.`);
          }
          
          setFile(null);
          // Reset file input
          const fileInput = document.getElementById("csv-file-input");
          if (fileInput) fileInput.value = "";
        } catch (err) {
          setError("Error processing CSV file: " + (err.message || "Unknown error"));
          console.error("CSV processing error:", err);
        }
        setLoading(false);
      };

      reader.onerror = () => {
        setError("Error reading file");
        setLoading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError("Error uploading marks: " + (err.message || "Unknown error"));
      setLoading(false);
    }
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
            component="h1" 
            gutterBottom 
            align="center"
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
            Upload External Marks
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload a CSV file with student external marks data
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            {success}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{
            borderRadius: 2,
            backgroundColor: isLight 
              ? alpha(theme.palette.primary.main, 0.04)
              : alpha(theme.palette.info.main, 0.08),
            p: 3,
            mb: 3,
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ mb: 2 }}
          >
            CSV Format Instructions
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
          <Typography variant="body2" color="text.secondary">• Column 1: Semester Number</Typography>
          <Typography variant="body2" color="text.secondary">• Column 2: USN</Typography>
          {[...Array(1)].map((_, i) => (
            <Box key={i} sx={{ ml: 2 }}>
              <Typography variant="body2" color="text.secondary">{`• Column ${3 + i * 7}: Subject Code ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${4 + i * 7}: Subject Name ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${5 + i * 7}: Internal Marks ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${6 + i * 7}: External Marks ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${7 + i * 7}: Total ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${8 + i * 7}: Attempt ${i + 1}`}</Typography>
              <Typography variant="body2" color="text.secondary">{`• Column ${9 + i * 7}: Result ${i + 1} (P/F)`}</Typography>
            </Box>
          ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={downloadTemplate}
              startIcon={<FileDownloadIcon />}
              sx={{
                borderRadius: '8px',
                py: 1.2,
                px: 3,
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
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="csv-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadFileIcon />}
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
                  {file ? file.name : "Choose File"}
                </Button>
              </label>
            </Box>

            <Button
              variant="contained"
              type="submit"
              disabled={loading || !file}
              startIcon={loading ? null : <CloudUploadIcon />}
              sx={{ 
                position: "relative",
                borderRadius: '8px',
                py: 1.2,
                px: 3,
                width: { xs: '100%', sm: 'auto' },
                bgcolor: isLight ? theme.palette.primary.main : theme.palette.info.main,
                '&:hover': {
                  bgcolor: isLight 
                    ? theme.palette.primary.dark
                    : theme.palette.info.dark,
                },
                '&.Mui-disabled': {
                  backgroundColor: isLight 
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.info.main, 0.3),
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress
                    size={24}
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                      color: 'white',
                    }}
                  />
                  Uploading...
                </>
              ) : (
                "Upload Marks"
              )}
            </Button>
          </Stack>
        </Box>

        <Paper 
          elevation={1} 
          sx={{ 
            p: 2,
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
            <strong>Sample format:</strong> Each row should include semester number, USN, subject details, marks, and results.
            Make sure the USN matches a student in the system.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddMarks; 
