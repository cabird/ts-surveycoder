import React from 'react';
import {useState} from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface MultiselectProps {
  options: Array<string>;
  selectedCodes: Array<string>;
  updateCodesCallback: (codes: Array<string>) => void;
};

function Multiselect( {options, selectedCodes, updateCodesCallback}: MultiselectProps) {

    const [codeOptions, setCodeOptions] = useState(options);
    const [selected, setSelected] = useState<string[]>(selectedCodes);
    const [newCodeValue, setNewCodeValue] = useState<string>("");
  
    const toggle = (value: string) => {
      const currentIndex = selected.indexOf(value);
      let newSelected: string[] = [];
      if (currentIndex === -1) {
        newSelected = [...selected, value];
      } else {
        newSelected = selected.filter((_, i) => i !== currentIndex);
      }
      setSelected(newSelected);
      updateCodesCallback(newSelected);
    }

    const addNewCode = () => {
      console.log("add new code added")
      const newCode = newCodeValue;
      if (newCode.length > 0 && !codeOptions.includes(newCode)) {

        const newOptions = [...codeOptions, newCode];
        setCodeOptions(newOptions);
        const newSelected = [...selected, newCode];
        setSelected(newSelected);
        updateCodesCallback(newSelected);
      }
    }

    const onNewCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newCode = event.target.value;
      console.log("new code is", newCode);
      setNewCodeValue(newCode);
    }
    
    codeOptions.sort();
    return (
      <div>
        <TextField variant='outlined' label='Add a code' onChange={onNewCodeChange}/>
        <Button variant='contained' onClick={addNewCode}>Add</Button>
        <Box sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray'}}>
            <List component="nav" aria-label="main mailbox folders">
              {codeOptions.map((code) => (
              <ListItemButton selected={ selected.indexOf(code) !== -1 } onClick={ () => toggle(code) }>
                <ListItemText primary={code} />
              </ListItemButton>
              ))}
            </List>
        </Box>
      </div>
    );
  }
  
  export default Multiselect;
  