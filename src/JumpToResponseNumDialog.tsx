import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface JumpToResponseNumDialogProps {
  open: boolean;
  numResponses: number;
  onClose: (action: string, responseNumber: number) => void;
}

export function JumpToResponseNumDialog(props: JumpToResponseNumDialogProps) {
  const [value, setValue] = React.useState<number>(0);

  const handleClose = (action: string, event: React.MouseEvent) => {
    console.log("handleClose " + action);
    props.onClose(action, value);
    setValue(0);

  }

  return (
    <div>
      <Dialog open={props.open} onClose={(e: React.MouseEvent) => handleClose("dialog_close", e)}>
        <DialogTitle>Jump To Response Number</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the number of the response to jump to (1 - {props.numResponses}).
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Response Number"
            fullWidth
            variant="standard"
            value={value}
            onChange={(event) => setValue(parseInt(event.target.value))}
            inputProps={{ type: 'number' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => handleClose("cancel", e)}>Cancel</Button>
          <Button onClick={(e) => handleClose("ok", e)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default JumpToResponseNumDialog;