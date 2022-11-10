import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useCoderStore } from './CoderState';

interface RenameDialogProps {
  open: boolean;
  onClose: (action: string, newCodeName: string) => void;
}

export default function RenameDialog(props: RenameDialogProps) {

  const rightClickedCode = useCoderStore(state => state.rightClickedCode);
  
  const [value, setValue] = React.useState(rightClickedCode);

  if (value === "" && rightClickedCode !== "") {
    setValue(rightClickedCode);
  }

  const handleClose = (action: string, event: React.MouseEvent) => {
    console.log("handleClose" + action);
    props.onClose(action, value);
    setValue("")
  }

  return (
    <div>
      <Dialog open={props.open} onClose={(e: React.MouseEvent) => handleClose("dialog_close", e)}>
        <DialogTitle>Rename Code</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the new name for the code "{rightClickedCode}".
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="New Code"
            fullWidth
            variant="standard"
            value={value}
            onChange={(event) => setValue(event.target.value)}
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