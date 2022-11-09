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
import MainAppBar from './MainAppBar';
import Box from '@mui/material/Box';
import { IconButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import RenameDialog from './RenameDialog';
import MergeCodesDialog from './MergeCodesDialog';

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
}

enum QuestionDirection {
  Previous,
  Next
}

enum WhichQuestion {
  Primary,
  Secondary
}

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
    };
  }

  private loadSurveyFromBlob = (fileBlob: Blob): void => {
    console.log("loadSurveyFromBlob");
    const surveyPromise = Survey.readSurveyFromExcelFile(fileBlob);
    surveyPromise.then((survey) => {
      console.log("Survey Loaded");
      console.log("There are " + survey.Responses.length + " responses");
      console.log("There are " + survey.Questions.length + " questions");
      this.updateUIFromSurvey(survey);
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
    if (this.state.survey == undefined || this.state.curResponse == undefined) {
      return;
    }

    //note that the response number is 1-based, not 0-based, but the index is 0-based
    let newResponseIndex = direction == QuestionDirection.Previous ? this.state.curResponse.ResponseNumber - 2 : this.state.curResponse.ResponseNumber;

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
      const sortedSelectedCodes = selectedCodes?.slice();
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
    return this.state.survey != undefined && this.state.curQuestion != undefined && this.state.curResponse != undefined;
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
        newCodes = codes.filter((c) => c != value);
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

  private menuItems = ["Info", "Export", "Import", "Settings"];
  private handleMenuItemClick = (menuItem: string) => {
    console.log("handleMenuItemClick: " + menuItem);
    switch (menuItem) {
      case "Export":
        this.exportSurvey();
        break;
    }
  }

  private exportSurvey = () => {
    console.log("exportSurvey");
    if (this.state.survey != undefined) {
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
        this.setState({
          ...this.state,
          mergeCodesDialogOpen: true,
          mergeCode: code
        });
        //this.mergeCode(code);
        break;
    }
  }

  /*private renameCode = (oldCodeName: string) => {
    console.log("renameCode: " + oldCodeName);
    if (this.isSurveyLoaded()) {
      this.setState({
        ...this.state,
        renameDialogOpen: true,
        renameCode: oldCodeName
      });
    }
  }*/
  
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
  


  render() {
    let questionOptions: SurveyQuestion[] = [];
    let surveyResponseText = "";
    let surveySecondaryResponseText = "";

    if (this.state.survey != undefined) {
      questionOptions = this.state.survey.Questions;
      if (this.state.curQuestion != undefined && this.state.curResponse != undefined) {
        surveyResponseText = this.state.curResponse.GetAnswerForQuestion(this.state.curQuestion.QuestionId);
      }
      if (this.state.curSecondaryQuestion != undefined && this.state.curResponse != undefined) {
        surveySecondaryResponseText = this.state.curResponse.GetAnswerForQuestion(this.state.curSecondaryQuestion.QuestionId);
      }
    }

    console.log("there are " + questionOptions.length + " questions2");
    console.log("current response id is " + this.state.curResponse?.ResponseId);

    let responseNumString = "Response: "
    let questionString = "Question ID: ";
    if (this.state.survey != undefined) {
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
          codeSet={this.state.codeSet}
          oldCodeName={this.state.mergeCode}
        />
      </div>
    );
  }
}

export default App;
