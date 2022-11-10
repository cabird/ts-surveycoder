import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useCoderStore } from './CoderState';
import shallow from 'zustand/shallow';

export function JumpToResponseNumDialog() {

    const { survey, setCurResponse, jumpToResponseNumDialogOpen, setJumpToResponseNumDialogOpen } =
        useCoderStore(state =>
        ({
            survey: state.survey,
            setCurResponse: state.setCurResponse,
            jumpToResponseNumDialogOpen: state.jumpToResponseNumDialogOpen,
            setJumpToResponseNumDialogOpen: state.setJumpToResponseNumDialogOpen,
        }), shallow
        );

    const [value, setValue] = React.useState<number>(0);

    const handleClose = (action: string, event: React.MouseEvent) => {
        console.log("handleClose for JumpToResponseNumDialog: " + action + " " + value);
        if (action === "ok" && survey && value > 0 && value <= survey!.Responses.length) {
            console.log("jumping to response number " + value);
            setCurResponse(survey!.Responses[value - 1]);
        }
        console.log("handleClose " + action);
        setValue(0);
        setJumpToResponseNumDialogOpen(false);

    }

    const numResponses = survey ? survey!.Responses.length : 0;
    return (
        <div>
            <Dialog open={jumpToResponseNumDialogOpen} onClose={(e: React.MouseEvent) => handleClose("dialog_close", e)}>
                <DialogTitle>Jump To Response Number</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the number of the response to jump to (1 - {numResponses}).
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