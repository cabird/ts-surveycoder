import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useCoderStore } from './CoderState';
import shallow from 'zustand/shallow';

interface MergeCodeDialogProps {
  open: boolean;
  onClose: (action: string, newCodeName: string) => void;
}

export default function MergeCodesDialog(props: MergeCodeDialogProps) {
  
  const { rightClickedCode, survey, curQuestion } = useCoderStore((state) => ({
    rightClickedCode: state.rightClickedCode,
    survey: state.survey,
    curQuestion: state.curQuestion,
  }), shallow);
  
  const [value, setValue] = React.useState(rightClickedCode);

  if (value === "" && rightClickedCode !== "") {
    setValue(rightClickedCode);
  }

  const handleClose = (action: string, event: React.MouseEvent) => {
    console.log("handleClose" + action);
    props.onClose(action, value);
    setValue("")
  }

  let codeSet: string[] = [];
  if (survey && curQuestion) {
    codeSet = survey.getCodesForQuestion(curQuestion);
    codeSet = codeSet.filter((code) => code !== rightClickedCode);
  }

  return (
    <div>
      <Dialog open={props.open} onClose={(e: React.MouseEvent) => handleClose("dialog_close", e)}>
        <DialogTitle>Merge Codes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please select the code that you would like to merge code "{rightClickedCode}" into.  All responses
            with the code "{rightClickedCode}" will be changed to the selected code.
          </DialogContentText>
          <InputLabel id="merge-code-label">Code to merge into</InputLabel>
          <Select
            autoFocus
            margin="dense"
            id="name"
            label="Code"
            fullWidth
            value={value}
            onChange={(event) => setValue(event.target.value)}
            >
            {codeSet.map((code) => (
              <MenuItem key={code} value={code}>{code}</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => handleClose("cancel", e)}>Cancel</Button>
          <Button onClick={(e) => handleClose("ok", e)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}