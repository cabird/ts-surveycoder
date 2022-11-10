import React, { useState } from 'react';
import './App.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MyDropzone from './MyDropzone';
import { Multiselect, CodesContextMenuItems} from './Multiselect';
import { Survey, SurveyQuestion } from './SurveyData/Survey';
import { SurveyResponse } from './SurveyData/SurveyResponse';
import QuestionSelect from './QuestionSelect';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { convertCompilerOptionsFromJson } from 'typescript';
import {MainAppBar, MenuItemInfo} from './MainAppBar';
import Box from '@mui/material/Box';
import { IconButton, MenuItem } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import RenameDialog from './RenameDialog';
import MergeCodesDialog from './MergeCodesDialog';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import JumpToResponseNumDialog from './JumpToResponseNumDialog';

interface AppProps {
  name: string;
}

interface AppState {
  survey?: Survey;
  curQuestion?: SurveyQuestion;
  curSecondaryQuestion?: SurveyQuestion;
  curResponse?: SurveyResponse;
  codeSet: string[];
  selectedCodes: string[];
  renameDialogOpen: boolean;
  renameCode: string;
  mergeCodesDialogOpen: boolean;
  mergeCode: string;
  mergeCodeSet: string[];
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "info" | "warning" | "error";
  jumpToResponseNumDialogOpen: boolean;
}

enum QuestionDirection {
  Previous,
  Next
}

enum WhichQuestion {
  Primary,
  Secondary
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
  ) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class App extends React.Component<AppProps, AppState> {

  constructor(props: any) {
    super(props);
    this.state = {
      survey: undefined,
      curQuestion: undefined,
      curSecondaryQuestion: undefined,
      curResponse: undefined,
      codeSet: [],
      selectedCodes: [],
      renameDialogOpen: false,
      renameCode: "",
      mergeCodesDialogOpen: false,
      mergeCode: "",
      mergeCodeSet: [],
      snackbarOpen: false,
      snackbarMessage: "",
      snackbarSeverity: "success",
      jumpToResponseNumDialogOpen: false
    };
  }

  private loadSurveyFromBlob = (fileBlob: File): void => {
    console.log("loadSurveyFromBlob");
    console.log(fileBlob);

    const surveyPromise = Survey.readSurveyFromExcelFile(fileBlob);
    surveyPromise.then((survey) => {
      console.log("Survey Loaded");
      console.log("There are " + survey.Responses.length + " responses");
      console.log("There are " + survey.Questions.length + " questions");
      this.updateUIFromSurvey(survey);
      //this.ShowSnackbarMessage(`Loaded Survey from ${fileBlob.name}`, "success");
    });
      
  }

  private updateUIFromSurvey = (survey: Survey): void => {
    console.log("updateUIFromSurvey");
    this.setState({
      ...this.state,
      survey: survey,
      curQuestion: survey.Questions[0],
      curResponse: survey.Responses[0],
      curSecondaryQuestion: survey.Questions[1]
    }, this.updateCodeState);
  }

  private handleQuestionChange = (whichQuestion: WhichQuestion, event: SelectChangeEvent) => {
    console.log("Question " + whichQuestion + " changed to " + event.target.value);
    if (this.state.survey) {
      const newQuestion = this.state.survey.Questions.find((q) => q.QuestionId === event.target.value);
      if (newQuestion) {
        if (whichQuestion === WhichQuestion.Primary) {
          this.setState({ ...this.state, curQuestion: newQuestion }, this.updateCodeState);
        } else {
          this.setState({ ...this.state, curSecondaryQuestion: newQuestion });
        }
      }
    }
  }

  private ChangeResponse = (direction: QuestionDirection) => {
    console.log("ChangeResponse");
    if (this.state.survey === undefined || this.state.curResponse === undefined) {
      return;
    }

    //note that the response number is 1-based, not 0-based, but the index is 0-based
    let newResponseIndex = direction === QuestionDirection.Previous ? this.state.curResponse.ResponseNumber - 2 : this.state.curResponse.ResponseNumber;

    //stay within bounds
    if (newResponseIndex >= 0 && newResponseIndex < this.state.survey.Responses.length) {
      console.log("Changing to response " + (newResponseIndex + 1));
      const curResponse = this.state.survey.Responses[newResponseIndex];
      this.setState({
        ...this.state,
        curResponse: curResponse,
      }, this.updateCodeState);
    }
  }

  // call this whenever the codes in the code list need to change, either because the list of codes changed
  // or the subset of selected codes changed.  This looks at the current response and question in the state,
  // so be sure to pass this as an arg to setState if you're changing those.
  private updateCodeState = () => {
    if (this.isSurveyLoaded()) {
      const selectedCodes = this.state.survey?.getCodesForResponseAndQuestion(this.state!.curResponse!, this.state!.curQuestion!);
      const codeSet = this.state.survey?.getCodesForQuestion(this.state!.curQuestion!);
      console.log("updateCodeState: code set is " + codeSet);
      console.log("updateCodeState: selected codes are " + selectedCodes);
      console.log("response id is " + this.state.curResponse?.ResponseId);
      this.setState({
        ...this.state,
        selectedCodes: selectedCodes!.slice(),
        codeSet: codeSet!.slice()
      });
    }
  }

  private isSurveyLoaded = (): boolean => {
    return this.state.survey !== undefined && this.state.curQuestion !== undefined && this.state.curResponse !== undefined;
  }

  private toggleCode = (value: string) => {
    console.log("toggleCode: " + value);
    // determine if this code is already selected
    if (this.isSurveyLoaded()) {
      const codes = this.state.survey!.getCodesForResponseAndQuestion(this.state.curResponse!, this.state.curQuestion!);
      const index = codes.indexOf(value);
      let newCodes: string[];
      if (index > -1) {
        // remove the code
        newCodes = codes.filter((c) => c !== value);
      } else {
        // add the code
        newCodes = codes.concat(value);
      }
      this.state.survey!.setCodesForResponseAndQuestion(this.state.curResponse!, this.state.curQuestion!, newCodes);
      this.updateCodeState();
    }
  }

  private onCodeSetChanged = (codeSet: Array<string>) => {
    console.log("new code set is", codeSet);
    if (this.isSurveyLoaded()) {
      const oldSelectedCodes = this.state.survey!.getCodesForResponseAndQuestion(this.state.curResponse!, this.state.curQuestion!);
      const oldCodeSet = this.state.survey!.getCodesForQuestion(this.state.curQuestion!);

      // get the codes that are in codeSet but not in oldCodeSet
      const addedCodes = codeSet.filter((c) => !oldCodeSet.includes(c));
      // now add these new codes to the currently set codes for this question for this response
      const newSelectedCodes = [...oldSelectedCodes, ...addedCodes];
      console.log("new selected codes are", newSelectedCodes, "old selected codes were", oldSelectedCodes, "for response number ", this.state.curResponse!.ResponseNumber);
      this.state.survey!.setCodesForResponseAndQuestion(this.state.curResponse!, this.state.curQuestion!, newSelectedCodes);
    }
    this.updateCodeState();
  }

  private menuItems = [
    new MenuItemInfo("Info"),
    new MenuItemInfo("Export"),
    new MenuItemInfo("Import"),
    new MenuItemInfo("Settings"), 
    new MenuItemInfo("next_uncoded", "Move to Next Uncoded Response"),
    new MenuItemInfo("to_response_number", "Move to Response Number")];

  private handleMenuItemClick = (menuItem: string) => {
    console.log("handleMenuItemClick: " + menuItem);
    switch (menuItem) {
      case "Export":
        this.exportSurvey();
        break;
      case "next_uncoded":
        this.moveNextUncoded();
        break;
      case "to_response_number":
        this.setState({ ...this.state, jumpToResponseNumDialogOpen: true });
        break;
    }
  }

  private moveNextUncoded = () => {
    if (this.state.survey) {
      // get current response number
      let curResponseNumber = this.state.curResponse!.ResponseNumber;
      curResponseNumber++
      // get the next uncoded response
      while (curResponseNumber < this.state.survey.Responses.length) {
        const response = this.state.survey.Responses[curResponseNumber];
        const questionAnswer = response.GetAnswerForQuestion(this.state.curQuestion!.QuestionId);
        const codes = this.state.survey.getCodesForResponseAndQuestion(response, this.state.curQuestion!);
        if (questionAnswer && (codes === undefined || codes.length === 0)) {
          this.setState({
            ...this.state,
            curResponse: response,
          }, this.updateCodeState);
          break;
        }
        curResponseNumber++;
      }
      if (curResponseNumber >= this.state.survey.Responses.length) {
       this.ShowSnackbarMessage("No more uncoded responses", "info");
      }
    }
  }

  private ShowSnackbarMessage(message: string, severity: "success" | "info" | "warning" | "error") {
    this.setState({
      ...this.state,
      snackbarOpen: true,
      snackbarMessage: message,
      snackbarSeverity: severity
    })
  }


  private exportSurvey = () => {
    console.log("exportSurvey");
    if (this.state.survey !== undefined) {
      var contents = this.state.survey.exportSurveyToExcelFile();
      return;
      //const blob = new Blob([contents], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      //convert binary string to blob

      /* const blob = new Blob([contents], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'survey.xlsx');
      document.body.appendChild(link);
      link.click(); */
    }
  }


  private handleCodesContextMenuClicked = (contextMenuItem: CodesContextMenuItems, code: string) => {
    console.log("handleCodesContextMenuClicked: " + contextMenuItem + " " + code);
    if (!this.isSurveyLoaded()) return;
    switch (contextMenuItem) {
      case CodesContextMenuItems.Rename:
        //this.renameCode(code);
        this.setState({
          ...this.state,
          renameDialogOpen: true,
          renameCode: code
        });
        break;
      case CodesContextMenuItems.Merge:
        const mergeCodeSet = this.state.codeSet.filter((c) => c !== code);
        this.setState({
          ...this.state,
          mergeCodesDialogOpen: true,
          mergeCode: code,
          mergeCodeSet: mergeCodeSet
        });
        //this.mergeCode(code);
        break;
    }
  }
  
  private handleRenameDialogClose = (action: string, newCodeName: string) => {
    console.log("handleRenameDialogClose: " + action + " " + newCodeName);
    if (action === "ok" && this.isSurveyLoaded()) {
      console.log("renaming code " + this.state.renameCode + " to " + newCodeName);
      this.state.survey!.renameCodeForQuestion(this.state.curQuestion!, this.state.renameCode!, newCodeName);
    } else {
      console.log("canceling rename");
    }
    this.setState({
      ...this.state,
      renameDialogOpen: false,
      renameCode: ""
    }, this.updateCodeState);
  }

  private handleMergeCodesDialogClose = (action: string, codeToMergeInto: string) => {
    console.log("handleMergeCodesDialogClose: " + action + " " + codeToMergeInto);
    if (action === "ok" && this.isSurveyLoaded()) {
      console.log("merging code " + this.state.mergeCode + " into " + codeToMergeInto);
      this.state.survey!.mergeCodesForQuestion(this.state.curQuestion!, this.state.mergeCode!, codeToMergeInto);
    } else {
      console.log("canceling merge");
    }
    this.setState({
      ...this.state,
      mergeCodesDialogOpen: false,
      mergeCode: ""
    }, this.updateCodeState);
  }

  private handleJumpToResponseNumDialogClose = (action: string, responseNum: number) => {
    console.log("handleJumpToResponseNumDialogClose: " + action + " " + responseNum);
    if (action === "ok" && this.isSurveyLoaded()) {
      console.log("jumping to response number " + responseNum);
      if (responseNum > 0 && responseNum <= this.state.survey!.Responses.length) {
        this.setState({
          ...this.state,
          curResponse: this.state.survey!.Responses[responseNum-1],
          jumpToResponseNumDialogOpen: false
        }, this.updateCodeState);
      }
    } else {
      console.log("canceling jump to response number");
      this.setState({
        ...this.state,
        jumpToResponseNumDialogOpen: false,
      });
    }
    
  }


  private handleSnackbarClose = (event: React.SyntheticEvent<any, Event> | Event, reason?: SnackbarCloseReason) => {
    console.log("handleSnackbarClose: " + reason);
    this.setState({
      ...this.state,
      snackbarOpen: false
      });
  }
  


  render() {
    let questionOptions: SurveyQuestion[] = [];
    let surveyResponseText = "";
    let surveySecondaryResponseText = "";

    if (this.state.survey !== undefined) {
      questionOptions = this.state.survey.Questions;
      if (this.state.curQuestion !== undefined && this.state.curResponse !== undefined) {
        surveyResponseText = this.state.curResponse.GetAnswerForQuestion(this.state.curQuestion.QuestionId);
      }
      if (this.state.curSecondaryQuestion !== undefined && this.state.curResponse !== undefined) {
        surveySecondaryResponseText = this.state.curResponse.GetAnswerForQuestion(this.state.curSecondaryQuestion.QuestionId);
      }
    }

    console.log("there are " + questionOptions.length + " questions2");
    console.log("current response id is " + this.state.curResponse?.ResponseId);

    let responseNumString = "Response: "
    let questionString = "Question ID: ";
    if (this.state.survey !== undefined) {
      responseNumString += this.state.curResponse?.ResponseNumber + " of " + this.state.survey.Responses.length;
      questionString += this.state.curQuestion?.QuestionId;
    }

    return (
      <div className="App">
        <MainAppBar onMenuItemClick={this.handleMenuItemClick} menuItems={this.menuItems} />
        <div>
          <MyDropzone onFileDropped={this.loadSurveyFromBlob} />
        </div>
        <Grid container spacing={2} alignItems="stretch" sx={{ height: "100%", width: "95%", marginTop: 1, marginLeft: 1, marginRight: 1, marginBottom: 1 }}>
          <Grid xs={9}>
            <Grid container spacing={2} alignItems="stretch" sx={{ height: "100%", width: "100%", marginTop: 1, marginLeft: 1, marginRight: 1, marginBottom: 1 }}>
              <Grid >
                <Button variant="contained" sx={{ width: 5, height: "100%" }} onClick={() => this.ChangeResponse(QuestionDirection.Previous)}>
                  <ArrowBackIcon />
                </Button>
              </Grid>
              <Grid >
                <Button variant="contained" sx={{ width: 5, height: "100%" }} onClick={() => this.ChangeResponse(QuestionDirection.Next)}>
                  <ArrowForwardIcon />
                </Button>
              </Grid>
              <Grid xs>
                <Stack direction={"row"} spacing={2} sx={{ height: "100%" }}>
                  <div>{responseNumString}</div>
                  <div>{questionString}</div>
                </Stack>
              </Grid>
              <Grid xs={12} >
                <QuestionSelect
                selectedQuestionId={this.state.curQuestion?.QuestionId || ""}
                label="Question" 
                options={questionOptions} 
                handleChange={(e) => this.handleQuestionChange(WhichQuestion.Primary, e)} />
              </Grid>
              <Grid xs={12} >
                <TextField
                  id="survey-response-text"
                  label="response"
                  multiline
                  variant="outlined"
                  value={surveyResponseText}
                  minRows={10}
                  inputProps={{ readOnly: true, height: "100%" }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Grid>
              <Grid xs={12} >
                <QuestionSelect 
                selectedQuestionId={this.state.curSecondaryQuestion?.QuestionId || ""}
                label="Secondary Question" 
                options={questionOptions} 
                handleChange={(e) => this.handleQuestionChange(WhichQuestion.Secondary, e)} />
              </Grid>
              <Grid xs={12} sx={{height: "100%"}} >
                <TextField
                  id="survey-response-text"
                  label="response"
                  multiline
                  variant="outlined"
                  value={surveySecondaryResponseText}
                  minRows={10}
                  inputProps={{ readOnly: true, height: "100%" }}
                  style={{ width: "100%", height: "100%" }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid xs={3}>
            <Multiselect
              key={this.state.curResponse?.ResponseId + "::" + this.state.curQuestion?.QuestionId}
              codeSet={this.state.codeSet}
              selectedCodes={this.state.selectedCodes}
              onToggleCode={this.toggleCode}
              onCodeSetChanged={this.onCodeSetChanged} 
              onContextMenuClicked={this.handleCodesContextMenuClicked}
              />
          </Grid>
        </Grid>
        <RenameDialog 
          key={"Rename::" + this.state.curQuestion?.QuestionId + "::" + this.state.renameCode} 
          open={this.state.renameDialogOpen} 
          onClose={this.handleRenameDialogClose} 
          oldCodeName={this.state.renameCode}  
        />
        <MergeCodesDialog
          key={"Merge::" + this.state.curQuestion?.QuestionId + "::" + this.state.mergeCode} 
          open={this.state.mergeCodesDialogOpen}
          onClose={this.handleMergeCodesDialogClose}
          codeSet={this.state.mergeCodeSet}
          oldCodeName={this.state.mergeCode}
        />
        <JumpToResponseNumDialog
          open={this.state.jumpToResponseNumDialogOpen}
          onClose={this.handleJumpToResponseNumDialogClose}
          numResponses={this.state.survey?.Responses.length || 0}
        />

        <Snackbar 
          open={this.state.snackbarOpen} 
          autoHideDuration={5000} 
          onClose={this.handleSnackbarClose}
          message={this.state.snackbarMessage}>
            <Alert onClose={this.handleSnackbarClose} severity={this.state.snackbarSeverity}>
              {this.state.snackbarMessage}
              </Alert>
          </Snackbar>
      </div>
    );
  }
}

export default App;
