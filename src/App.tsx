import React, {useState} from 'react';
import './App.css';
import {Student, AppName, Level} from './interfaces';
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
import {Survey, SurveyQuestion} from './SurveyData/Survey';
import { SurveyResponse } from './SurveyData/SurveyResponse';
import QuestionSelect from './QuestionSelect';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { convertCompilerOptionsFromJson } from 'typescript';


interface AppProps {
  name: string;
}

interface AppState {
  survey?: Survey;
  curQuestion?: SurveyQuestion;
  curResponse?: SurveyResponse;
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
      curResponse: undefined
    };
  }

  private updateCodes = (codes: Array<string>) => {
    console.log("new codes are", codes);
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
    this.setState({...this.state,
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
      this.setState({...this.state,
        curResponse: curReponse,
      });
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

    const codes = ['code 1', 'code 2', 'code 3', 'code 4', 'code 5'];
    const selectedCodes = ['code 1', 'code 3'];
      
    let responseNumString = "Response: "
    let questionString = "Question: ";
    if (this.state.survey != undefined) {
      responseNumString += this.state.curResponse?.ResponseNumber + " of " + this.state.survey.Responses.length;
      questionString += this.state.curQuestion?.QuestionText;
    }

    return (
      <div className="App">
        <div>
          <MyDropzone onFileDropped={this.loadSurveyFromBlob} />
        </div>
        <div>
          <Button variant="contained" onClick={() => this.ChangeResponse(QuestionDirection.Previous)}>Previous</Button>
          <Button variant="contained" onClick={() => this.ChangeResponse(QuestionDirection.Next)}>Next</Button>
        </div>
        <div>{responseNumString}</div>
        <div>{questionString}</div>
        <div>
          <QuestionSelect options={questionOptions} handleChange={this.handleQuestionChange}/>
        </div>
        
        <div id="main-content-div">
          <div id="response-div">
            <TextField id="survey-response-text" label="response" multiline rows={10} variant="outlined"
              value={surveyResponseText} inputProps={ {readOnly: true, } }/>
          </div>
          <div id="test-div">
            
            <Multiselect options={codes} selectedCodes={selectedCodes} updateCodesCallback={this.updateCodes} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
