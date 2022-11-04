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
  private allColumnNames: string[] = [];
  private columnTexts: string[] = [];

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

  public getCodesForQuestion(question: SurveyQuestion): string[] {
    return this.responseCodes.getCodesForQuestion(question.QuestionId);
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



  //add a response to the survey
  public static async readSurveyFromExcelFile(fileBlob: Blob): Promise<Survey> {
    console.log("reading survey from excel file");

    const buffer = await fileBlob.arrayBuffer();
    const wb = read(buffer, {type: 'array', dense: true});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data: (number | string)[][] = utils.sheet_to_json(ws, {header: 1});
    console.log(data);

    // these are the values for qualtrics config.  Should probably move to a config object
    const survey = Survey.fromArrayOfArrays(data, 0, 1, 2, 'ResponseId');
    return survey;
  }

  /* load the survey data from an array of arrays. */
  private static fromArrayOfArrays(data: (number | string)[][], headerRow: 
    number, textRow: number, responseStartRow: number, responseIdName: string): Survey {
    const responses: SurveyResponse[] = [];
    const questions: SurveyQuestion[] = [];

    //read the column names and text
    for (let i = 0; i < data[headerRow].length; i++) {
      questions.push(new SurveyQuestion(data[headerRow][i].toString(), data[textRow][i].toString()));
    }

    /* grab the headers and the text, paying special attention to the code columns */
    const allColumnNames: string[] = [];
    const columnNames: string[] = [];
    const columnTexts: string[] = [];
    for (let i = 0; i < data[headerRow].length; i++) {
      const colName = data[headerRow][i].toString();
      allColumnNames.push(colName);
      if (colName.endsWith("-codes")) continue;
      columnNames.push(colName);
      columnTexts.push(data[textRow][i].toString());
    }

    
    const responseIdColumn = questions.findIndex((q) => q.QuestionId === responseIdName);
    // assert that we actually found it and the id column is not -1...
    const surveyResponseCodes = new SurveyResponseCodes();

    //read the responses
    let responseNumber = 0;
    for (let i = responseStartRow; i < data.length; i++) {
      responseNumber++;
      const row = data[i];
      const responseId = row[responseIdColumn].toString();
      const response: SurveyResponse = new SurveyResponse(responseNumber, responseId);

      for (let j = 0; j < row.length; j++) {
        if (allColumnNames[j].endsWith("-codes"))
        {
          //check if the cell is empty or whitespace
          if (row[j] === undefined || row[j] === null || row[j].toString().trim() === "") {
            continue;
          }
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
    rows.push(mergedColumnText);

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



