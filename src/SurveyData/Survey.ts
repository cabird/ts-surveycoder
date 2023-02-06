// @deno-types="https://cdn.sheetjs.com/xlsx-0.19.0/package/types/index.d.ts"
import { json } from 'stream/consumers';
import { read, write, utils, writeFileXLSX } from 'xlsx';

import { SurveyResponse } from './SurveyResponse';
import { SurveyResponseCodes } from './SurveyResponseCodes';

export class SurveyQuestion {
    private questionText: string;
    private questionId: string;

    constructor(questionId: string, questionText: string) {
        this.questionText = questionText;
        this.questionId = questionId;
    }
    public get QuestionText(): string {
        return this.questionText;
    }
    public get QuestionId(): string {
        return this.questionId;
    }
}

//create a survey class
export class Survey {

  private columnNames: string[] = [];
  private columnTexts: string[] = [];
  private allColumnNames: string[] = [];
  private IsQualticsSurvey: boolean = false;

  private questions: SurveyQuestion[];
  public get Questions(): SurveyQuestion[] {
    return this.questions;
  }
  private questionIdToQuestion?: Map<string, number> = undefined;

  private responses: SurveyResponse[];
  private responseIdToResponseNumber?: Map<string, number> = undefined;
  public get Responses(): SurveyResponse[] {
    return this.responses;
  }

  private responseCodes: SurveyResponseCodes;

  public get ResponseCodes(): SurveyResponseCodes {
    return this.responseCodes;
  }

  public setCodesForResponseAndQuestion(response: SurveyResponse, question: SurveyQuestion, codes: string[]): void {
    this.responseCodes.setCodesForResponseAndQuestion(response.ResponseId, question.QuestionId, codes);
  }

  public getCodesForResponseAndQuestion(response: SurveyResponse, question: SurveyQuestion): string[] {
    const answer = this.responseCodes.getCodesForResponseAndQuestion(response.ResponseId, question.QuestionId);
    return answer;
  }

  public getResponsesForCodeAndQuestion(code: string, question: SurveyQuestion): SurveyResponse[] {
    const responseIds = this.responseCodes.getResponsesForCodeAndQuestion(code, question.QuestionId);
    const responses: SurveyResponse[] = [];
    responseIds.forEach((responseId) => {
      const response = this.ResponseFromResponseId(responseId);
      if (response !== undefined) {
        responses.push(response);
      }
    });
    return responses;
  }

  public getCodesForQuestion(question: SurveyQuestion): string[] {
    return this.responseCodes.getCodesForQuestion(question.QuestionId);
  }

  public renameCodeForQuestion(question: SurveyQuestion, oldCodeName: string, newCodeName: string): void {
    this.responseCodes.renameCodeForQuestion(question.QuestionId, oldCodeName, newCodeName);
  }
  
  public mergeCodesForQuestion(question: SurveyQuestion, codeToDelete: string, codeToKeep: string): void {
    this.responseCodes.mergeCodesForQuestion(question.QuestionId, codeToDelete, codeToKeep);
  }

  constructor(questions: SurveyQuestion[]) {
    this.responseCodes = new SurveyResponseCodes();
    this.questions = questions;
    this.responses = [];

  }

  public ResponseNumberForResponseId(responseId: string): number {
    if (this.responseIdToResponseNumber === undefined) {
        this.responseIdToResponseNumber = new Map<string, number>();
        this.responses.forEach((response) => {
            this.responseIdToResponseNumber!.set(response.ResponseId, response.ResponseNumber);
        });
    }
    if (this.responseIdToResponseNumber.has(responseId)) {
        return this.responseIdToResponseNumber.get(responseId)!;
    }
    return -1;
 }
    public ResponseFromResponseId(responseId: string): SurveyResponse | undefined {
        const responseNumber = this.ResponseNumberForResponseId(responseId);
        if (responseNumber === -1) {
            return undefined;
        }
        return this.responses[responseNumber - 1];
    }

    public ResponseFromResponseNumber(responseNumber: number): SurveyResponse | undefined {
        if (responseNumber < 1 || responseNumber > this.responses.length) {
            return undefined;
        }
        return this.responses[responseNumber - 1];
    }

    public QuestionFromQuestionId(questionId: string): SurveyQuestion | undefined {
        if (this.questionIdToQuestion === undefined) {
            this.questionIdToQuestion = new Map<string, number>();
            this.questions.forEach((question, index) => {
                this.questionIdToQuestion!.set(question.QuestionId, index);
            });
        }
        if (this.questionIdToQuestion.has(questionId)) {
            return this.questions[this.questionIdToQuestion.get(questionId)!];
        }
        return undefined;
    }


  public static async readSurveyFromCSVFile(fileBlob: Blob): Promise<Survey> {
    console.log("reading survey from csv file");
    const buffer = await fileBlob.arrayBuffer();
    const wb = read(buffer, {type:"binary"});
    var data: (number | string)[][] = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
    console.log(data);
    const survey = Survey.fromArrayOfArrays(data);
    return survey;
  }

  //add a response to the survey
  public static async readSurveyFromExcelFile(fileBlob: Blob): Promise<Survey> {
    console.log("reading survey from excel file");

    const buffer = await fileBlob.arrayBuffer();
    const wb = read(buffer, {type: 'array', dense: true});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: (number | string)[][] = utils.sheet_to_json(ws, {header: 1});
    console.log(data);

    // these are the values for qualtrics config.  Should probably move to a config object
    const survey = Survey.fromArrayOfArrays(data);
    return survey;
  }

  private static IsSurveyDataFromQualtrics(data: (number | string)[][]): boolean {
    if (data.length < 3) return false;
    if (data[0].length < 1) return false;
    if (data[1].length < 1) return false;
    if (data[0][0].toString().toLowerCase().replace(' ', '') === 
          data[1][0].toString().toLowerCase().replace(' ', '')) return true;
    return false;
  }

  private static GetValueOrDefault(value: string | number | undefined, defaultValue: string | number): string | number {
    if (value === undefined || value === null || value === "") return defaultValue;
    return value;
  }

  /* load the survey data from an array of arrays. */
  private static fromArrayOfArrays(data: (number | string)[][]): Survey {
    const responses: SurveyResponse[] = [];
    const questions: SurveyQuestion[] = [];
    const IsQualticsSurvey = Survey.IsSurveyDataFromQualtrics(data);
    let headerRow = 0;
    let textRow = 0;

    if (IsQualticsSurvey) {
      console.log('This is a qualtrics survey');
      textRow = 1;
    } else
    {
      console.log('This is not a qualtrics survey');
    }

    /* grab the headers and the text, paying special attention to the code columns */
    const allColumnNames: string[] = [];
    const columnNames: string[] = [];
    const columnTexts: string[] = [];
    for (let i = 0; i < data[headerRow].length; i++) {

      const colName = this.GetValueOrDefault(data[headerRow][i], "col_"+(i+1)).toString();
      const colText = this.GetValueOrDefault(data[textRow][i], "col_"+(i+1)).toString();
      allColumnNames.push(colName);
      if (colName.endsWith("-codes")) continue;
      columnNames.push(colName);
      columnTexts.push(colText);
      questions.push(new SurveyQuestion(colName, colText));
    }

    var responseIdColumn = -1;
    if (IsQualticsSurvey) {
      // There is a column named "ResponseId" in all qualtrics surveys I have seen.
      // But it's honestly not the end of the world if we don't fint it, since we default to the response number.
      responseIdColumn = questions.findIndex((q) => q.QuestionId === "ResponseId");
      console.log('responseIdColumn = ' + responseIdColumn);
    }

    // assert that we actually found it and the id column is not -1...
    const surveyResponseCodes = new SurveyResponseCodes();

    //read the responses
    let responseNumber = 0;
    for (let i = textRow+1; i < data.length; i++) {
      responseNumber++;
      const row = data[i];
      // if there is no response ID column then we use the response number as the ID
      const responseId = responseIdColumn >= 0 ? row[responseIdColumn].toString() : responseNumber.toString();
      const response: SurveyResponse = new SurveyResponse(responseNumber, responseId);

      for (let j = 0; j < row.length; j++) {
        //check if the cell is empty or whitespace
        if (row[j] === undefined || row[j] === null || row[j].toString().trim() === "") {
          continue;
        }
        if (allColumnNames[j].endsWith("-codes"))
        {
          const questionName = allColumnNames[j].replace("-codes", "");
          //split codes by comma or semicolon
          const codes = row[j].toString().split(/[,;]/).map((s) => s.trim());
          surveyResponseCodes.setCodesForResponseAndQuestion(responseId, questionName, codes);
        } else {
          response.SetAnswerForQuestion(allColumnNames[j], row[j].toString());
        }
      }
      responses.push(response);
    }

    // TODO: fix this so that we create the survey up front and add the data as we go...
    const survey: Survey = new Survey(questions);
    survey.IsQualticsSurvey = IsQualticsSurvey;
    survey.responseCodes = surveyResponseCodes;
    survey.responses = responses;
    survey.columnNames = columnNames;
    survey.allColumnNames = allColumnNames;
    survey.columnTexts = columnTexts;
    return survey;
  }

  public exportSurveyToExcelFile(): string {
    const rows: string[][] = [];

    const mergedColumnNames: string[] = [];
    const mergedColumnText: string[] = [];
    //create a set of merged columns  
    const questionsWithCodes: string[] = [];

    for (let i = 0; i < this.columnNames.length; i++) {
      const questionId = this.columnNames[i];
      const questionText = this.columnTexts[i];
      mergedColumnNames.push(questionId);
      mergedColumnText.push(questionText);
      if (this.responseCodes.hasCodesForQuestion(questionId)) {
        questionsWithCodes.push(questionId);
        mergedColumnNames.push(questionId + "-codes");
        mergedColumnText.push(questionText + "-codes");
      }
    }
    rows.push(mergedColumnNames);
    if (this.IsQualticsSurvey) {
      rows.push(mergedColumnText);
    }

    //add the responses
    for (let i = 0; i < this.responses.length; i++) {
      const response = this.responses[i];
      const row: string[] = [];
      for (let j = 0; j < this.columnNames.length; j++) {
        const questionId = this.columnNames[j];
        if (response.HasAnswerForQuestion(questionId)) {
          row.push(response.GetAnswerForQuestion(questionId));
        } else {
          row.push("");
        }
        /* save the codes for this response separated by semicolons */
        if (questionsWithCodes.includes(questionId)) {
          const codes = this.responseCodes.getCodesForResponseAndQuestion(response.ResponseId, questionId);
          if (codes !== undefined) {
            codes.sort();
            row.push(codes.join("; "));
          } else {
            row.push("");
          }
        }
      }
      rows.push(row);
    }

    // now create the excel sheet
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet(rows);
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFileXLSX(wb, "survey.xlsx");
    //const wbout: any = write(wb, {bookType: 'xlsx', type: 'binary'});
    return "test";
  }
}



