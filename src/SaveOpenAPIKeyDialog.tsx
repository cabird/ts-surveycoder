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

export function SaveOpenAPIKeyDialog() {

    const {saveOpenAPIKeyDialogOpen, setSaveOpenAPIKeyDialogOpen } =
        useCoderStore(state =>
        ({
            saveOpenAPIKeyDialogOpen: state.saveOpenAPIKeyDialogOpen,
            setSaveOpenAPIKeyDialogOpen: state.setSaveOpenAPIKeyDialogOpen,
        }), shallow
        );

    const [value, setValue] = React.useState<string>("");

    const handleClose = (action: string, event: React.MouseEvent) => {
        console.log("handleClose for SaveOpenAPIKeyDialog: " + action + " " + value);
        if (action === "ok" && value != "") {
            console.log("saving API key " + value);
            //save 
            localStorage.setItem("OpenAI_API_Key", value);
        }
        setValue("");
        console.log("handleClose " + action);
        setSaveOpenAPIKeyDialogOpen(false);
    }

    return (
        <div>
            <Dialog open={saveOpenAPIKeyDialogOpen} onClose={(e: React.MouseEvent) => handleClose("dialog_close", e)}>
                <DialogTitle>Save OpenAI API Key</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your OpenAPI Key
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Key"
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

export default SaveOpenAPIKeyDialog;