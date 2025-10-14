import React, { useState, useCallback, useEffect, useContext } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  useTheme,
  Typography,
  TablePagination,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  alpha,
  Chip,
  Avatar,
} from "@mui/material";
import { useSnackbar } from "notistack";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Page from "../../components/Page";
import api from "../../utils/axios";

function HodViewMentors() {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [mentors, setMentors] = useState([]);
  const [page, setPage] = useState(0);
  const rowsPerPageOptions = [10, 20, 25];
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const tableHeaderColor = isLight ? theme.palette.primary.main : theme.palette.info.main;

  const getAssignedMentors = useCallback(async () => {
    try {
      setLoading(true);
      console.log("=== Fetching Mentors for HOD ===");
      console.log("HOD Department:", user?.department);
      
      // Fetch all students with their mentor assignments (same as Admin)
      const response = await api.get("/mentors/allocation-students");
      const studentsData = response.data?.data || [];
      
      console.log(`Fetched ${studentsData.length} total students`);
      
      // Filter students by HOD's department and group by mentor
      const mentorMap = new Map();
      
      studentsData.forEach((student) => {
        // Only process students from HOD's department who have mentors
        if (student.department === user?.department && student.mentor) {
          const mentorId = student.mentor._id;
          const mentorName = student.mentor.name;
          
          if (!mentorMap.has(mentorId)) {
            mentorMap.set(mentorId, {
              _id: mentorId,
              name: mentorName,
              students: []
            });
          }
          
          mentorMap.get(mentorId).students.push(student);
        }
      });
      
      console.log(`Found ${mentorMap.size} mentors in ${user?.department} department`);
      
      if (mentorMap.size === 0) {
        setMentors([]);
        enqueueSnackbar("No mentors found with assigned students in your department", { variant: "info" });
        setLoading(false);
        return;
      }
      
      // Fetch all faculty to get complete mentor information
      const facultyResponse = await api.get("/users?role=faculty");
      const allFaculty = facultyResponse.data?.data?.users || [];
      
      console.log(`Fetched ${allFaculty.length} faculty members`);
      
      // Build mentor list with full details
      const mentorsList = Array.from(mentorMap.values()).map(mentorData => {
        const facultyInfo = allFaculty.find(f => f._id === mentorData._id);
        
        return {
          _id: mentorData._id,
          name: mentorData.name,
          email: facultyInfo?.email || 'N/A',
          phone: facultyInfo?.phone || 'N/A',
          department: facultyInfo?.department || user?.department,
          roleName: 'faculty',
          menteeCount: mentorData.students.length
        };
      });
      
      // Sort by mentee count
      mentorsList.sort((a, b) => b.menteeCount - a.menteeCount);
      
      console.log(`Setting ${mentorsList.length} mentors:`, mentorsList);
      setMentors(mentorsList);
      
      enqueueSnackbar(`Found ${mentorsList.length} assigned mentors`, { variant: "success" });
      
    } catch (error) {
      console.error("Error fetching mentors:", error);
      enqueueSnackbar("Failed to fetch mentors", { variant: "error" });
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [user, enqueueSnackbar]);

  useEffect(() => {
    if (user && user.department) {
      console.log("useEffect triggered - fetching mentors");
      getAssignedMentors();
    } else {
      console.log("User or department not available:", { user: user?.name, dept: user?.department });
    }
  }, [getAssignedMentors, user]);

  const handleViewMentorDashboard = (mentor) => {
    // Navigate to faculty dashboard as HOD viewing this mentor
    navigate(`/hod/mentor-dashboard/${mentor._id}`);
  };

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch = mentor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const paginatedMentors = filteredMentors.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Page title="View Mentors">
      <Card>
        <Box 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            py: 2
          }}
        >
          <Typography variant="h6" component="h1" sx={{ fontWeight: 500 }}>
            Assigned Mentors in {user.department} Department
          </Typography>
          <Chip 
            icon={<SchoolIcon />}
            label={`${filteredMentors.length} Assigned Mentors`}
            color={isLight ? "primary" : "info"}
            variant="outlined"
          />
        </Box>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                fullWidth
                placeholder="Search assigned mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <Button size="small" onClick={() => setSearchQuery("")}>
                        <ClearIcon />
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: alpha(tableHeaderColor, 0.1) }}>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Mentor Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="center">Assigned Mentees</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          Loading assigned mentors...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedMentors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary">
                          No assigned mentors found in your department
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMentors.map((mentor) => (
                      <TableRow 
                        key={mentor._id}
                        hover
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: isLight 
                              ? alpha(theme.palette.primary.main, 0.05) 
                              : alpha(theme.palette.info.main, 0.05)
                          } 
                        }}
                      >
                        <TableCell>
                          <Avatar 
                            sx={{ 
                              backgroundColor: isLight 
                                ? theme.palette.primary.main 
                                : theme.palette.info.main 
                            }}
                          >
                            {mentor.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {mentor.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{mentor.email}</TableCell>
                        <TableCell>{mentor.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={mentor.department} 
                            size="small"
                            sx={{
                              backgroundColor: isLight 
                                ? alpha(theme.palette.primary.main, 0.1) 
                                : alpha(theme.palette.info.main, 0.15)
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            icon={<PeopleIcon />}
                            label={mentor.menteeCount}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            color={isLight ? "primary" : "info"}
                            onClick={() => handleViewMentorDashboard(mentor)}
                            startIcon={<DashboardIcon />}
                          >
                            View Dashboard
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={rowsPerPageOptions}
              component="div"
              count={filteredMentors.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Stack>
        </CardContent>
      </Card>
    </Page>
  );
}

export default React.memo(HodViewMentors);
