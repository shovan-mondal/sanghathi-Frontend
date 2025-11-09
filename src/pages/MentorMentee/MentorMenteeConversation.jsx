import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Box,
  Paper,
} from "@mui/material";

const MentorMenteeConversation = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [mooc, setMooc] = useState(false);
  const [miniProject, setMiniProject] = useState(false);
  const [summary, setSummary] = useState("");

  const mentees = [
    { id: 1, name: "Riya Sharma" },
    { id: 2, name: "Amit Patel" },
    { id: 3, name: "Neha Singh" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (summary.length < 30) {
      alert("Summary must be at least 30 characters long!");
      return;
    }
    const data = {
      student: selectedStudent,
      mooc,
      miniProject,
      summary,
    };
    console.log("Offline conversation saved:", data);
    alert("Offline conversation saved successfully!");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          Mentor-Mentee Conversation (Offline)
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Select Student */}
          <TextField
            select
            label="Select Mentee"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          >
            {mentees.map((mentee) => (
              <MenuItem key={mentee.id} value={mentee.name}>
                {mentee.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Checkboxes */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mooc}
                  onChange={(e) => setMooc(e.target.checked)}
                />
              }
              label="MOOC Completed"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={miniProject}
                  onChange={(e) => setMiniProject(e.target.checked)}
                />
              }
              label="Mini Project Completed"
            />
          </Box>

          {/* Summary */}
          <TextField
            label="Conversation Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            fullWidth
            required
            multiline
            minRows={4}
            helperText="Minimum 30 characters"
            sx={{ mb: 3 }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={!selectedStudent}
          >
            Save Offline Conversation
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default MentorMenteeConversation;
