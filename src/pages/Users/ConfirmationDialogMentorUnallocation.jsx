// Create a new component: ConfirmationDialogUnassign.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const ConfirmationDialogUnassign = ({ open, onClose, onConfirm, studentsToUnassign }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Unassign Mentors</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to unassign mentors from the following students?
        </Typography>
        <List dense>
          {studentsToUnassign.map((student) => (
            <ListItem key={student._id}>
              <ListItemText
                primary={student.name}
                secondary={`Current Mentor: ${student.mentor?.name || 'Unknown'}`}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Unassign Mentors
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialogUnassign;