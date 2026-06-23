import Snackbar from '@mui/material/Snackbar';

export default function CustomSnackbar({ open, onClose, message, vertical = "top", horizontal = "center" }) {
    return (
        <Snackbar
            anchorOrigin={{ vertical, horizontal }}
            open={open}
            onClose={onClose}
            message={message}
            autoHideDuration={3000}
            key={vertical + horizontal}
        />
    );
}