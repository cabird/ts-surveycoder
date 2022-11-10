import React from 'react';
import './App.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MyDropzone from './MyDropzone';
import { Multiselect } from './Multiselect';
import { Survey } from './SurveyData/Survey';
import QuestionSelect, { WhichQuestion } from './QuestionSelect';
import { MainAppBar, MenuItemInfo } from './MainAppBar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import JumpToResponseNumDialog from './JumpToResponseNumDialog';
import { useCoderStore } from './CoderState';
import shallow from 'zustand/shallow';

interface AppProps {
  name: string;
}

enum QuestionDirection {
  Previous,
  Next
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const appBarMenuItems = [
  new MenuItemInfo("Info"),
  new MenuItemInfo("Export"),
  new MenuItemInfo("Import"),
  new MenuItemInfo("Settings"),
  new MenuItemInfo("next_uncoded", "Move to Next Uncoded Response"),
  new MenuItemInfo("to_response_number", "Move to Response Number")];

export function App(props: AppProps) {

  const { survey, 
    setSurvey, 
    curQuestion, 
    curSecondaryQuestion, 
    curResponse, 
    setCurQuestion, 
    setCurResponse, 
    setCurSecondaryQuestion,
    setJumpToResponseNumDialogOpen } =
    useCoderStore(state =>
    ({
      survey: state.survey,
      setSurvey: state.setSurvey,
      curQuestion: state.curQuestion,
      curSecondaryQuestion: state.curSecondaryQuestion,
      curResponse: state.curResponse,
      setCurQuestion: state.setCurQuestion,
      setCurResponse: state.setCurResponse,
      setCurSecondaryQuestion: state.setCurSecondaryQuestion,
      setJumpToResponseNumDialogOpen: state.setJumpToResponseNumDialogOpen,
    }), shallow
    );



  const loadSurveyFromBlob = (fileBlob: File): void => {
    console.log("loadSurveyFromBlob");
    console.log(fileBlob);
    const surveyPromise = Survey.readSurveyFromExcelFile(fileBlob);
    surveyPromise.then((survey) => {
      console.log("Survey Loaded");
      console.log("There are " + survey.Responses.length + " responses");
      console.log("There are " + survey.Questions.length + " questions");
      setSurvey(survey);
      setCurQuestion(survey.Questions[0]);
      setCurResponse(survey.Responses[0]);
      setCurSecondaryQuestion(survey.Questions[1]);
      //this.ShowSnackbarMessage(`Loaded Survey from ${fileBlob.name}`, "success");
    });
  }


  const ChangeResponse = (direction: QuestionDirection) => {
    console.log("ChangeResponse");
    if (survey === undefined) {
      return;
    }
    const curResponseIndex = curResponse ? curResponse.ResponseNumber - 1 : 0;
    //note that the response number is 1-based, not 0-based, but the index is 0-based
    const newResponseIndex = direction === QuestionDirection.Previous ? curResponseIndex - 1 : curResponseIndex + 1;
    //stay within bounds
    if (newResponseIndex >= 0 && newResponseIndex < survey!.Responses.length) {
      console.log("Changing to response " + (newResponseIndex + 1));
      setCurResponse(survey!.Responses[newResponseIndex]);
    }
  }

  // TODO - make isLoaded part of the state
  const isSurveyLoaded = (): boolean => {
    return survey !== undefined && curQuestion !== undefined && curResponse !== undefined;
  }

  const handleMenuItemClick = (menuItem: string) => {
    console.log("handleMenuItemClick: " + menuItem);
    switch (menuItem) {
      case "Export":
        exportSurvey();
        break;
      case "next_uncoded":
        moveNextUncoded();
        break;
      case "to_response_number":
        setJumpToResponseNumDialogOpen(true);
        break;
    }
  }

  const moveNextUncoded = () => {
    if (survey) {
      // get current response number
      let curResponseNumber = curResponse!.ResponseNumber;
      curResponseNumber++
      // get the next uncoded response
      while (curResponseNumber < survey.Responses.length) {
        const response = survey.Responses[curResponseNumber];
        const questionAnswer = response.GetAnswerForQuestion(curQuestion!.QuestionId);
        const codes = survey.getCodesForResponseAndQuestion(response, curQuestion!);
        if (questionAnswer?.trim() && (codes === undefined || codes.length === 0)) {
          setCurResponse(response);
          break;
        }
        curResponseNumber++;
      }
      if (curResponseNumber >= survey.Responses.length) {
        ShowSnackbarMessage("No more uncoded responses", "info");
      }
    }
  }

  const ShowSnackbarMessage = (message: string, severity: "success" | "info" | "warning" | "error") => {
    //TODO - do this
    /*this.setState({
      ...this.state,
      snackbarOpen: true,
      snackbarMessage: message,
      snackbarSeverity: severity
    })*/
  }


  const exportSurvey = () => {
    console.log("exportSurvey");
    if (survey !== undefined) {
      survey.exportSurveyToExcelFile();
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

  const handleSnackbarClose = (event: React.SyntheticEvent<any, Event> | Event, reason?: SnackbarCloseReason) => {
    /*console.log("handleSnackbarClose: " + reason);
    this.setState({
      ...this.state,
      snackbarOpen: false
      });*/
  }

  const surveyResponseText = isSurveyLoaded() ? curResponse!.GetAnswerForQuestion(curQuestion!.QuestionId) : "";
  const surveySecondaryResponseText = isSurveyLoaded() ? curResponse!.GetAnswerForQuestion(curSecondaryQuestion!.QuestionId) : "";

  console.log("current response id is " + curResponse?.ResponseId);

  let responseNumString = "Response: "
  let questionString = "Question ID: ";
  if (isSurveyLoaded()) {
    responseNumString += curResponse?.ResponseNumber + " of " + survey!.Responses.length;
    questionString += curQuestion?.QuestionId;
  }

  return (
    <div className="App">
      <MainAppBar onMenuItemClick={handleMenuItemClick} menuItems={appBarMenuItems} />
      <div>
        <MyDropzone onFileDropped={loadSurveyFromBlob} />
      </div>
      <Grid container spacing={2} alignItems="stretch" sx={{ height: "100%", width: "95%", marginTop: 1, marginLeft: 1, marginRight: 1, marginBottom: 1 }}>
        <Grid xs={9}>
          <Grid container spacing={2} alignItems="stretch" sx={{ height: "100%", width: "100%", marginTop: 1, marginLeft: 1, marginRight: 1, marginBottom: 1 }}>
            <Grid >
              <Button variant="contained" sx={{ width: 5, height: "100%" }} onClick={() => ChangeResponse(QuestionDirection.Previous)}>
                <ArrowBackIcon />
              </Button>
            </Grid>
            <Grid >
              <Button variant="contained" sx={{ width: 5, height: "100%" }} onClick={() => ChangeResponse(QuestionDirection.Next)}>
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
                whichQuestion={WhichQuestion.Primary}
                label="Question"
              />
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
                label="Secondary Question"
                whichQuestion={WhichQuestion.Secondary}
              />
            </Grid>
            <Grid xs={12} sx={{ height: "100%" }} >
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
          <Multiselect />
        </Grid>
      </Grid>
      <JumpToResponseNumDialog />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

const snackbarOpen = false;
const snackbarMessage = "";
const snackbarSeverity = "info";

export default App;
