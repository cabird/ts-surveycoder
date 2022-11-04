import React, { useState } from 'react';
import './App.css';
import { Student, AppName, Level } from './interfaces';
//import {DisplayData } from './DisplayData';
//import {studentList, coursesList} from "./data";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
//import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MyDropzone from './MyDropzone';
import Multiselect from './Multiselect';
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
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

interface AppProps {
  name: string;
}

interface AppState {
  survey?: Survey;
  curQuestion?: SurveyQuestion;
  curResponse?: SurveyResponse;
  codeSet: Array<string>;
  selectedCodes: Array<string>;
}

enum QuestionDirection {
  Previous,
  Next
}

class App extends React.Component<AppProps, AppState> {


  constructor(props: any) {
    super(props);
    this.state = {
      survey: undefined,
      curQuestion: undefined,
      curResponse: undefined,
      codeSet: [],
      selectedCodes: []
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
      survey: survey,
      curQuestion: survey.Questions[0],
      curResponse: survey.Responses[0],
    });
    const qTexts = survey.Questions.map((q) => q.QuestionText);
    console.log(qTexts.length + " questions");
    //setQuestionOptions(qTexts);
  }

  private handleQuestionChange = (event: SelectChangeEvent) => {
    console.log("Question changed to " + event.target.value);
    const curQuestion = this.state.survey?.QuestionFromQuestionId(event.target.value);
    this.setState({
      ...this.state,
      curQuestion: curQuestion,
    });
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
      const curReponse = this.state.survey.Responses[newResponseIndex];
      this.setState({
        ...this.state,
        curResponse: curReponse,
      });
    }
  }

  private updateCodeState = () => {
    if (this.isSurveyLoaded()) {
      const selectedCodes = this.state.survey?.getCodesForResponseAndQuestion(this.state!.curResponse!, this.state!.curQuestion!);
      const codeSet = this.state.survey?.getCodesForQuestion(this.state!.curQuestion!);
      console.log("updateCodeState: code set is " + codeSet);
      this.setState({
        ...this.state,
        selectedCodes: selectedCodes!,
        codeSet: codeSet!
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

      const blob = new Blob([contents], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'survey.xlsx');
      document.body.appendChild(link);
      link.click();
    }
  }





  render() {
    let questionOptions: SurveyQuestion[] = [];
    let surveyResponseText = "";

    if (this.state.survey != undefined) {
      questionOptions = this.state.survey.Questions;
      if (this.state.curQuestion != undefined && this.state.curResponse != undefined) {
        surveyResponseText = this.state.curResponse.GetAnswerForQuestion(this.state.curQuestion.QuestionId);
      }
    }

    console.log("there are " + questionOptions.length + " questions2");
    console.log("current response id is " + this.state.curResponse?.ResponseId);

    let codes: string[] = [];
    let selectedCodes: string[] = [];

    let responseNumString = "Response: "
    let questionString = "Question: ";
    if (this.state.survey != undefined) {
      responseNumString += this.state.curResponse?.ResponseNumber + " of " + this.state.survey.Responses.length;
      questionString += this.state.curQuestion?.QuestionText;
    }

    // get the codes for this response for this question
    if (this.state.curQuestion != undefined && this.state.curResponse != undefined) {
      selectedCodes = this.state.survey?.ResponseCodes.getCodesForResponseAndQuestion(
        this.state.curResponse.ResponseId, this.state.curQuestion.QuestionId) || [];
      codes = this.state.survey?.ResponseCodes.getCodesForQuestion(this.state.curQuestion.QuestionId) || [];
    }

    return (
      <div className="App">
        <MainAppBar onMenuItemClick={this.handleMenuItemClick} menuItems={this.menuItems} />
        <div>
          <MyDropzone onFileDropped={this.loadSurveyFromBlob} />
        </div>


        <div>{responseNumString}</div>
        <div>{questionString}</div>

        <Grid container spacing={2} alignItems="stretch" sx={{ height: "100%", width: "95%", marginTop: 1, marginLeft: 1, marginRight: 1, marginBottom: 1 }}>
          <Grid item xs={1} >
            <Button variant="contained" sx={{ height: "100%" }} onClick={() => this.ChangeResponse(QuestionDirection.Previous)}>
              <ArrowBackIcon />
            </Button>
          </Grid>
          <Grid item xs={1} >
            <Button variant="contained" sx={{ height: "100%" }} onClick={() => this.ChangeResponse(QuestionDirection.Next)}>
              <ArrowForwardIcon />
            </Button>
          </Grid>
          <Grid item xs={7} sx={{ height: "100%" }}>
            <QuestionSelect options={questionOptions} handleChange={this.handleQuestionChange} />
          </Grid>

          <Grid item xs={9} sx={{height: "100%"}} >
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
          <Grid item xs={3}>
            <Multiselect
              codeSet={codes}
              selectedCodes={selectedCodes}
              onToggleCode={this.toggleCode}
              onCodeSetChanged={this.onCodeSetChanged} />
          </Grid>
        </Grid>

      </div>
    );
  }
}

export default App;
