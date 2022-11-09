import React from 'react';
import { useState } from 'react';
import { makeStyles, withStyles } from '@mui/material';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ConstructionOutlined } from '@mui/icons-material';
import './Multiselect.css';

export enum CodesContextMenuItems {
  Rename = "rename",
  Merge = "merge"
}

interface MultiselectProps {
  codeSet: Array<string>;
  selectedCodes: Array<string>;
  onToggleCode: (code: string) => void;
  onCodeSetChanged: (codes: Array<string>) => void;
  onContextMenuClicked: (contextMenuItem: CodesContextMenuItems, code: string) => void;
};

export function Multiselect(props: MultiselectProps) {

  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const [rightClickedCode, setRightClickedCode] = useState<string>("");

  const handleContextMenu = (code: string, event: React.MouseEvent) => {
    event.preventDefault();
    console.log("handleContextMenu: code is " + code);
    setRightClickedCode(code);
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  const handleContextMenuClick = (contextMenuItem: CodesContextMenuItems, event: React.MouseEvent) => {
    console.log("handleClick " + contextMenuItem);
    if (rightClickedCode != "") {
      console.log("ContextMenu handleClick " + contextMenuItem + " on code " + rightClickedCode);
      props.onContextMenuClicked(contextMenuItem, rightClickedCode);
    }
    setContextMenu(null);
  }

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
              <ListItemButton 
                onContextMenu={(e) => handleContextMenu(code, e)} 
                key={code} 
                sx={{ height: 24,
                  '&.Mui-selected': {backgroundColor: '#1976d2', color: 'white'},
                  '&.Mui-selected:hover': {backgroundColor: '#1976d2dd', color: 'white'},
                }}
                selected={props.selectedCodes.indexOf(code) !== -1}
                onClick={() => toggleCode(code)}>
                <ListItemText primary={code} />
              </ListItemButton>
            ))}
            <Menu 
              open={contextMenu !== null}
              anchorReference = "anchorPosition"
              anchorPosition={
                contextMenu !== null
                  ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                  : undefined
              }
              >
                <MenuItem key="rename" id="rename" onClick={(e) => handleContextMenuClick(CodesContextMenuItems.Rename, e)}>Rename</MenuItem>
                <MenuItem key="merge" id="merge" onClick={(e) => handleContextMenuClick(CodesContextMenuItems.Merge, e)}>Merge into other code</MenuItem>
              </Menu>
          </List>
        </Box>
      </Grid>
    </Grid>
  );
}

export default Multiselect;
