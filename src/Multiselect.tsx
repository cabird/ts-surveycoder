import React from 'react';
import { useState, useRef } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './Multiselect.css';
import { useCoderStore } from './CoderState';
import shallow from 'zustand/shallow';
import RenameDialog from './RenameDialog';
import MergeCodesDialog from './MergeCodesDialog';
import { Stack } from '@mui/system';
import { AskGPT } from './AskGPT';


export enum CodesContextMenuItems {
  Rename = "rename",
  Merge = "merge"
}

export interface MultiselectProps {
  textInputRef: React.RefObject<HTMLElement>
}

export function Multiselect(props: MultiselectProps) {

  const { survey, curQuestion, renameDialogOpen, setRenameDialogOpen, mergeCodesDialogOpen, setMergeCodesDialogOpen } =
    useCoderStore(state =>
    ({
      survey: state.survey,
      curQuestion: state.curQuestion,
      renameDialogOpen: state.renameDialogOpen,
      setRenameDialogOpen: state.setRenameDialogOpen,
      mergeCodesDialogOpen: state.mergeCodesDialogOpen,
      setMergeCodesDialogOpen: state.setMergeCodesDialogOpen
    }), shallow
    );

  const curResponse = useCoderStore((state) => state.curResponse,
  );

  let allCodes: string[] = []
  let selCodes: string[] = []

  if (survey && curQuestion && curResponse) {
    allCodes = survey.getCodesForQuestion(curQuestion);
    selCodes = survey.getCodesForResponseAndQuestion(curResponse, curQuestion);
  }

  allCodes.sort();

  console.log("Multiselect rendering for response " + curResponse?.ResponseId);
  console.log("Selected codes are " + selCodes);

  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // this is mostly here to force a re-rerender when the set of selected codes changes
  // since the list of selected codes is not part of the state of this component, only the question that contains
  // the selected codes is part of the state of this component, so we need to force a re-render when the selected codes change
  const [localCodes, setLocalCodes] = useState<string[]>();
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
    if (rightClickedCode != "" && contextMenuItem) {
      console.log("ContextMenu handleClick " + contextMenuItem + " on code " + rightClickedCode);
      switch (contextMenuItem) {
        case CodesContextMenuItems.Rename:
          setRenameDialogOpen(true);
          break;
        case CodesContextMenuItems.Merge:
          setMergeCodesDialogOpen(true);
          break;
      }
      setContextMenu(null);
    }
  }

  const [newCodeValue, setNewCodeValue] = useState<string>("");

  const toggleCode = (value: string) => {
    console.log("toggleCode " + value);
    const codes: string[] = survey?.getCodesForResponseAndQuestion(curResponse!, curQuestion!) || [];
    const newCodes = codes.includes(value) ?
      codes.filter((code) => code !== value)
      : [...codes, value];
    survey!.setCodesForResponseAndQuestion(curResponse!, curQuestion!, newCodes);
    setLocalCodes(newCodes);
  }

  const addNewCode = () => {
    if (survey && curQuestion && curResponse) {
      const newCode = newCodeValue.trim();
      const allCodes = survey?.getCodesForQuestion(curQuestion);
      if (newCode.length > 0 && !allCodes.includes(newCode)) {
        const qCodes = survey!.getCodesForResponseAndQuestion(curResponse!, curQuestion!);
        //check if qcodes has the new code
        if (!qCodes.includes(newCode)) {
          const newCodes = [...qCodes, newCode];
          survey!.setCodesForResponseAndQuestion(curResponse!, curQuestion!, newCodes);
          setLocalCodes(newCodes);
        }
      }
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
      setNewCodeValue("");
    }
  }

  //move this into the dialog
  const handleRenameDialogClose = (action: string, newCodeName: string) => {
    console.log("handleRenameDialogClose: " + action + " " + newCodeName);
    if (survey && curQuestion && action == "ok") {
      console.log("renaming code " + rightClickedCode + " to " + newCodeName);
      survey.renameCodeForQuestion(curQuestion, rightClickedCode, newCodeName);
    }
    setRightClickedCode("");
    setRenameDialogOpen(false);
  }

  // move this into the dialog
  const handleMergeCodesDialogClose = (action: string, codeToMergeInto: string) => {
    console.log("handleMergeCodesDialogClose: " + action + " " + codeToMergeInto);
    if (action === "ok" && survey && curQuestion) {
      console.log("merging code " + rightClickedCode + " into " + codeToMergeInto);
      survey.mergeCodesForQuestion(curQuestion, rightClickedCode, codeToMergeInto);
    }
    setRightClickedCode("");
    setMergeCodesDialogOpen(false);
  }

  interface GPTSuggestions {
    responseId: string;
    questionId: string;
    codes: string[];
  }
  const [gptSuggestedCodes, setGptSuggestedCodes] = useState<GPTSuggestions>({ responseId: "", questionId: "", codes: [] });

  let localGptSuggestedCodes:string[] = [];

  if (curQuestion && curResponse && curQuestion.QuestionId == gptSuggestedCodes.questionId 
    && curResponse.ResponseId == gptSuggestedCodes.responseId) {
    localGptSuggestedCodes = gptSuggestedCodes.codes;
  }

  const getGPTSuggestedCodes = () => {
    console.log("getGPTSuggestedCodes");
    if (!curQuestion || !curResponse || !survey) return;
    AskGPT.getCodeSuggestionsForResponse(survey, curQuestion, curResponse).then((codes) => {
      console.log("Got codes from GPT: " + codes);
      setGptSuggestedCodes({ responseId: curResponse.ResponseId, questionId: curQuestion.QuestionId, codes: codes });
    });
  }

  return (
    <>
      <Stack direction={"row"} spacing={2} sx={{ height: "100%" }}>
        <TextField style={{ width: "100%" }} variant='outlined' value={newCodeValue} label='Add a code' onChange={onNewCodeChange}
          onKeyPress={handleKeyPress}
          inputRef={props.textInputRef}/>
        <Button variant='contained' style={{ height: "100%" }} onClick={addNewCode} >Add</Button>
        <Button variant='contained' style={{ height: "100%" }} onClick={getGPTSuggestedCodes} >GPT</Button>
      </Stack>
      <Box sx={{ border: 1, borderRadius: 1, borderColor: 'lightgray', gridRowStart: 2, gridRowEnd: 6 }}>
        <List component="nav" aria-label="Code List"  >
          {allCodes.map((code) => (
            <ListItemButton
              onContextMenu={(e) => handleContextMenu(code, e)}
              key={code}
              sx={{
                height: 24,
                '&.gpt_suggested': {borderWidth: 2, borderColor: 'red', borderStyle: 'solid', borderRadius: 1},
                '&.Mui-selected': { backgroundColor: '#1976d2', color: 'white' },
                '&.Mui-selected:hover': { backgroundColor: '#1976d2dd', color: 'white' },
              }}
              className={localGptSuggestedCodes.indexOf(code) !== -1 ? "gpt_suggested" : ""}
              selected={selCodes.indexOf(code) !== -1}
              onClick={() => toggleCode(code)}>
              <ListItemText primary={code} />
            </ListItemButton>
          ))}
          <Menu
            open={contextMenu !== null}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
            onClose={() => setContextMenu(null)}
          >
            <MenuItem key="rename" id="rename" onClick={(e) => handleContextMenuClick(CodesContextMenuItems.Rename, e)}>Rename</MenuItem>
            <MenuItem key="merge" id="merge" onClick={(e) => handleContextMenuClick(CodesContextMenuItems.Merge, e)}>Merge into other code</MenuItem>
          </Menu>
        </List>
      </Box>
      <RenameDialog
        open={renameDialogOpen}
        onClose={handleRenameDialogClose}
      />
      <MergeCodesDialog
        open={mergeCodesDialogOpen}
        onClose={handleMergeCodesDialogClose}
      />
    </>
  );
}

export default Multiselect;
