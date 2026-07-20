// src/components/Modal.jsx
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  IconButton,
} from "@mui/material";
export default function Modal({
  open = false,
  title,
  children,
  buttons,
  onClose,
}) {
  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="close"></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>{children}</DialogContent>

      {buttons && <DialogActions>{buttons}</DialogActions>}
    </Dialog>
  );
}
