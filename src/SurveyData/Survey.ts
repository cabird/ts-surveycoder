// @deno-types="https://cdn.sheetjs.com/xlsx-0.19.0/package/types/index.d.ts"
import { read, utils, writeFileXLSX } from 'xlsx';

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
  private questions: SurveyQuestion[];
  private responses: SurveyResponse[];

  private responseIdToResponseNumber?: Map<string, number> = undefined;
  private questionIdToQuestion?: Map<string, number> = undefined;

  public get Responses(): SurveyResponse[] {
    return this.responses;
  }

  public get Questions(): SurveyQuestion[] {
    return this.questions;
  }

  constructor(questions: SurveyQuestion[]) {
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

    const responseIdColumn = questions.findIndex((q) => q.QuestionId === responseIdName);
    // assert that we actually found it and the id column is not -1...

    //read the responses
    let responseNumber = 0;
    for (let i = responseStartRow; i < data.length; i++) {
      responseNumber++;
      const responseId = data[i][responseIdColumn].toString();
      const response: SurveyResponse = new SurveyResponse(responseNumber, responseId);
      for (let j = 0; j < data[i].length; j++) {
        response.SetAnswerForQuestion(questions[j].QuestionId, data[i][j].toString());
      }
      responses.push(response);

    }

    const survey: Survey = new Survey(questions);
    survey.responses = responses;
    return survey;
  }




}



