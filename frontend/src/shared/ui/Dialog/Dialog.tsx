import React from 'react';
import { 
  Dialog as MuiDialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface DialogProps {
  open: boolean;
  title?: React.ReactNode;
  content: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  onClose?: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  content,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  onClose
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      {title && (
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{title}</Typography>
            {onClose && (
              <IconButton aria-label="close" onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}
      <DialogContent dividers>
        {content}
      </DialogContent>
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
};