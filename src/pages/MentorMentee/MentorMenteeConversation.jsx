import React, { useState, useEffect, useContext } from "react";
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
  CircularProgress,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  CheckCircleOutline,
  InfoOutlined,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const MentorMenteeConversation = () => {
  const { user } = useContext(AuthContext);
  const { enqueueSnackbar } = useSnackbar();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [mooc, setMooc] = useState(false);
  const [miniProject, setMiniProject] = useState(false);
  const [summary, setSummary] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch actual mentees
  const [mentees, setMentees] = useState([]);
  const [loadingMentees, setLoadingMentees] = useState(true);
  const [error, setError] = useState(null);
  const [existingConversation, setExistingConversation] = useState(null);
  const [checkingConversation, setCheckingConversation] = useState(false);

  useEffect(() => {
    if (!user) {
      setError("User not authenticated.");
      setLoadingMentees(false);
      return;
    }

    const fetchMentees = async () => {
      try {
        console.log("📥 Fetching mentees for user:", user._id);
        const response = await api.get(`/mentorship/${user._id}/mentees`);
        console.log("✅ Mentees fetched successfully:", response.data.mentees);
        setMentees(response.data.mentees);
      } catch (err) {
        console.error("❌ Error fetching mentees:", err);
        console.error("❌ Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError("No mentees found.");
        enqueueSnackbar("Failed to load mentees", { variant: "error" });
      } finally {
        setLoadingMentees(false);
      }
    };

    fetchMentees();
  }, [user, enqueueSnackbar]);

  // Check if conversation already exists for selected mentee
  useEffect(() => {
    const checkExistingConversation = async () => {
      if (!selectedStudent || !user) {
        setExistingConversation(null);
        return;
      }

      try {
        setCheckingConversation(true);
        console.log("🔍 Checking for existing conversation...", {
          mentorId: user._id,
          menteeId: selectedStudent,
        });

        const response = await api.get("/conversations");
        const conversations = response.data;

        // Find conversation for this mentor-mentee pair
        const existing = conversations.find(
          (conv) =>
            conv.mentorId === user._id &&
            conv.menteeId === selectedStudent &&
            conv.isOffline === true &&
            conv.description // Has AI-generated summary
        );

        if (existing) {
          console.log("✅ Found existing conversation:", existing);
          setExistingConversation(existing);
        } else {
          console.log("📝 No existing conversation found");
          setExistingConversation(null);
        }
      } catch (error) {
        console.error("❌ Error checking existing conversation:", error);
        setExistingConversation(null);
      } finally {
        setCheckingConversation(false);
      }
    };

    checkExistingConversation();
  }, [selectedStudent, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (summary.length < 30) {
      enqueueSnackbar("Summary must be at least 30 characters long!", {
        variant: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 Submitting offline conversation...", {
        mentorId: user._id,
        menteeId: selectedStudent,
        title: title || "Offline Conversation",
        topic: topic || "Offline Mentorship",
        conversationText: summary,
        moocChecked: mooc,
        projectChecked: miniProject,
      });

      const response = await api.post("/conversations/mentor-mentee", {
        mentorId: user._id,
        menteeId: selectedStudent,
        title: title || "Offline Conversation",
        topic: topic || "Offline Mentorship",
        conversationText: summary,
        moocChecked: mooc,
        projectChecked: miniProject,
      });

      console.log("✅ API Response received:", response.data);

      if (response.status === 201) {
        const { aiSummary, conversation } = response.data.data;

        console.log("✅ Conversation saved successfully:", {
          conversationId: conversation._id,
          descriptionLength: conversation.description?.length,
          aiSummaryLength: aiSummary?.length,
        });

        enqueueSnackbar(
          "Conversation saved successfully! AI summary has been generated.",
          {
            variant: "success",
            autoHideDuration: 5000,
          }
        );

        console.log("📝 AI Generated Summary:", aiSummary);

        // Reset form
        setSelectedStudent("");
        setMooc(false);
        setMiniProject(false);
        setSummary("");
        setTitle("");
        setTopic("");
      }
    } catch (error) {
      console.error("❌ Error saving offline conversation:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      enqueueSnackbar(
        error.response?.data?.message || "Error saving offline conversation!",
        { variant: "error" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setExistingConversation(null);
    setSummary("");
    setTitle("");
    setTopic("");
    setMooc(false);
    setMiniProject(false);
  };

  if (loadingMentees) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading mentees...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Grid container spacing={3}>
        {/* Left Side - Form */}
        <Grid item xs={12} md={7}>
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
                disabled={mentees.length === 0}
                helperText={mentees.length === 0 ? "No mentees assigned to you" : ""}
              >
                {mentees.map((mentee) => (
                  <MenuItem key={mentee._id} value={mentee._id}>
                    {mentee.name}
                  </MenuItem>
                ))}
              </TextField>

            {/* Existing Conversation Alert */}
            {checkingConversation && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <CircularProgress size={20} />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Checking for existing conversation...
                </Typography>
              </Box>
            )}

            {existingConversation && !checkingConversation && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  bgcolor: "#e8f5e9",
                  border: "2px solid #4caf50"
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleCreateNew}
                    sx={{ fontWeight: "bold" }}
                  >
                    Create New
                  </Button>
                }
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32", mb: 1 }}>
                  Mentoring Already Done for This Person
                </Typography>
                <Typography variant="caption" sx={{ color: "#1b5e20", display: "block", mb: 1 }}>
                  <strong>Date:</strong> {new Date(existingConversation.date).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </Typography>
                {existingConversation.title && (
                  <Typography variant="caption" sx={{ color: "#1b5e20", display: "block", mb: 1 }}>
                    <strong>Title:</strong> {existingConversation.title}
                  </Typography>
                )}
                
              </Alert>
            )}

              {/* Title (Optional) */}
              <TextField
                label="Conversation Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
              />

              {/* Topic (Optional) */}
              <TextField
                label="Topic (Optional)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                fullWidth
                sx={{ mb: 3 }}
              />

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
                minRows={6}
                helperText="Minimum 30 characters - AI will generate a detailed summary"
                sx={{ mb: 3 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!selectedStudent || isLoading || mentees.length === 0}
                startIcon={isLoading && <CircularProgress size={20} />}
              >
                {isLoading ? "Generating AI Summary..." : "Save Offline Conversation"}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* Right Side - Guidance Box */}
        <Grid item xs={12} md={5}>
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              bgcolor: "#f0f7ff",
              border: "2px solid",
              borderColor: "primary.main",
              position: "sticky",
              top: 100
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InfoOutlined color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: "bold" }}>
                Tips for Better AI Summary
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Alert severity="info" sx={{ mb: 2, bgcolor: "#e3f2fd" }}>
              <Typography variant="body2" sx={{ color: "#01579b", fontWeight: 500 }}>
                To get a comprehensive AI-generated summary, include these details in your conversation text:
              </Typography>
            </Alert>

            <List dense sx={{ py: 0 }}>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Student's Concerns/Problems</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>What challenges or issues did the student raise?</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Counseling Approach Used</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>What techniques or methods did you use? (e.g., active listening, goal-setting, problem-solving)</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Guidance & Recommendations</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>What advice, resources, or action steps did you provide?</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Student's Response</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>How did the student react? Were they receptive?</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Achievements Discussed</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>Academic performance, MOOC completions, projects, extracurriculars</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Resolution Status</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>Was the problem resolved? Are follow-ups needed?</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>

              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleOutline color="success" sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="body2" sx={{ fontWeight: 600, color: "#1a237e" }}>Career/Academic Goals</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: "#37474f" }}>Future plans, internships, placements, higher studies</Typography>}
                  sx={{ my: 0 }}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: "#fff3e0", p: 2, borderRadius: 2, border: "1px solid #ffb74d" }}>
              <Typography variant="body2" sx={{ color: "#e65100", fontWeight: 500 }}>
                💡 <strong>Pro Tip:</strong> Write the conversation in a dialogue format or structured narrative to help the AI better understand the context and generate an accurate summary.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MentorMenteeConversation;
