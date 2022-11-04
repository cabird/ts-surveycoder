import React from 'react';
import { useState } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';

interface MultiselectProps {
  codeSet: Array<string>;
  selectedCodes: Array<string>;
  onToggleCode: (code: string) => void;
  onCodeSetChanged: (codes: Array<string>) => void;
};

function Multiselect(props: MultiselectProps) {

  const [newCodeValue, setNewCodeValue] = useState<string>("");

  const toggleCode = (value: string) => {
    props.onToggleCode(value);
  }

  const addNewCode = () => {
    const newCode = newCodeValue.trim();
    if (newCode.length > 0 && !props.codeSet.includes(newCode)) {
      const newCodeSet = [...props.codeSet, newCode];
      props.onCodeSetChanged(newCodeSet);
      setNewCodeValue("");
    }
  }

  const onNewCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = event.target.value;
    console.log("new code is", newCode);
    setNewCodeValue(newCode);
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addNewCode();
    }
  }

  props.codeSet.sort();
  return (
    <Grid container spacing={2}>
      <Grid xs style={{ width: "100%" }}>
        <TextField style={{ width: "100%" }} variant='outlined' value={newCodeValue} label='Add a code' onChange={onNewCodeChange} 
        onKeyPress={handleKeyPress}/>
      </Grid>
      <Grid>
        <Button variant='contained' style={{ height: "100%"}} onClick={addNewCode} >Add</Button>
      </Grid>
      <Grid xs={12}>
        <Box sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray' }}>
          <List component="nav" aria-label="Code List" sx={{ minHeight: 600 }} >
            {props.codeSet.map((code) => (
              <ListItemButton key={code} sx={{ height: 24 }}
                selected={props.selectedCodes.indexOf(code) !== -1}
                onClick={() => toggleCode(code)}>
                <ListItemText primary={code} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Grid>
    </Grid>
  );
}

export default Multiselect;
