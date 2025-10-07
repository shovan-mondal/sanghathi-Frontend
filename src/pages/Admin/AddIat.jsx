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

const AddIat = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);

  const downloadTemplate = () => {
    const headers = [
      "USN", "SEMESTER",
      "SUBJECT CODE", "SUBJECT NAME", "IAT1", "IAT2", "IA FINAL Marks",
      "SUBJECT CODE", "SUBJECT NAME", "IAT1", "IAT2", "IA FINAL",
      "SUBJECT CODE", "SubjectName", "IAT1", "IAT2", "Final IA Marks",
      "SubjectCode", "SubjectName", "IAT1", "IAT2", "Final IA Marks",
      "SubjectCode", "SubjectName", "IAT1", "IAT2", "Final IA Marks",
      "SubjectCode", "SubjectName", "IAT1", "IAT2", "Final IA Marks",
      "Subject Code", "SubjectName", "IAT1", "IAT2", "Final IA Marks"
    ];
    const exampleRow = [
      "1CR23IS001", "IV",
      "BCS401", "Ada", "AB", "AB", "22",
      "BIS402", "Advanced Java", "0", "0", "20",
      "BCS403", "DBMS", "0", "0", "22",
      "BBOC407", "Biology", "0", "0", "22",
      "BSCK307", "UHV", "0", "0", "22",
      "BCSL404", "Ada Lab", "0", "0", "22",
      "BCS405A", "Dms", "0", "0", "22"
    ];
    const csvContent = Papa.unparse([headers, exampleRow], { quotes: true });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "iat_template.csv");
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
        try {
          rows = JSON.parse(content);
        } catch (error) {
          setErrors(["Invalid JSON format."]);
          setErrorCount(1);
          setProcessing(false);
          return;
        }
      } else {
        const results = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => (value === "" ? undefined : value),
        });
        rows = results.data;
      }
      // Convert wide rows to normalized rows
      const normalizedRows = [];
      for (const row of rows) {
        // USN and SEMESTER
        const usn = row["USN"];
        const semester = row["SEMESTER"];
        // Each subject group is 5 columns, starting from index 2
        const subjectKeys = Object.keys(row).filter(
          (k) => k !== "USN" && k !== "SEMESTER"
        );
        for (let i = 0; i < subjectKeys.length; i += 5) {
          const codeKey = subjectKeys[i];
          const nameKey = subjectKeys[i + 1];
          const iat1Key = subjectKeys[i + 2];
          const iat2Key = subjectKeys[i + 3];
          const finalKey = subjectKeys[i + 4];
          if (
            row[codeKey] &&
            row[nameKey]
          ) {
            normalizedRows.push({
              USN: usn,
              SEMESTER: semester,
              SubjectCode: row[codeKey],
              SubjectName: row[nameKey],
              IAT1: row[iat1Key],
              IAT2: row[iat2Key],
              FinalIA: row[finalKey],
            });
          }
        }
      }
      await processRows(normalizedRows);
    };
    reader.readAsText(file);
  };

  const processRows = async (rows) => {
    let success = 0;
    let errors = 0;
    const newErrors = {};

    // Group by USN and SEMESTER
    const groupedData = {};
    for (const row of rows) {
      if (!row.USN || !row.SEMESTER || !row.SubjectCode || !row.SubjectName) {
        const errMsg = `Row with missing USN, SEMESTER, SubjectCode, or SubjectName: ${JSON.stringify(row)}`;
        newErrors[errMsg] = true;
        errors++;
        continue;
      }
      const key = `${row.USN}-${row.SEMESTER}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          usn: row.USN,
          semester: row.SEMESTER,
          subjects: [],
        };
      }
      groupedData[key].subjects.push({
        subjectCode: row.SubjectCode,
        subjectName: row.SubjectName,
        iat1: row.IAT1 !== undefined && row.IAT1 !== "AB" ? parseInt(row.IAT1, 10) : row.IAT1,
        iat2: row.IAT2 !== undefined && row.IAT2 !== "AB" ? parseInt(row.IAT2, 10) : row.IAT2,
        avg: row.FinalIA !== undefined && row.FinalIA !== "AB" ? parseInt(row.FinalIA, 10) : row.FinalIA,
      });
    }

    for (const key in groupedData) {
      const data = groupedData[key];
      try {
        const response = await axios.get(
          `${BASE_URL}/users/usn/${data.usn}`
        );
        if (!response.data?.userId) {
          throw new Error(`User with USN ${data.usn} not found`);
        }
        const userId = response.data.userId;
        const iatData = {
          semester: data.semester,
          subjects: data.subjects,
        };
        await axios.post(
          `${BASE_URL}/students/iat/${userId}`,
          iatData
        );
        success++;
      } catch (error) {
        errors++;
        newErrors[`Error for USN ${data.usn}, Semester ${data.semester}: ${error.message}`] = true;
      }
    }

    setSuccessCount(success);
    setErrorCount(errors);
    setErrors(Object.keys(newErrors));
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
            Upload IAT Marks
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload a CSV file with Internal Assessment Test marks for students
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
            Upload Instructions
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please ensure your CSV file has the following columns:
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
            <Typography variant="body2" color="text.secondary">• USN - Student USN</Typography>
            <Typography variant="body2" color="text.secondary">• Sem - Semester number</Typography>
            <Typography variant="body2" color="text.secondary">• SubjectCode - Course code</Typography>
            <Typography variant="body2" color="text.secondary">• SubjectName - Course name</Typography>
            <Typography variant="body2" color="text.secondary">• IAT1 - First IAT marks</Typography>
            <Typography variant="body2" color="text.secondary">• IAT2 - Second IAT marks</Typography>
          </Box>

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
                    `${file ? 'File Selected' : 'Upload File'}`
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
            <strong>Note:</strong> Make sure each USN corresponds to a registered student in the system. 
            Missing or invalid USNs will result in errors.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddIat;