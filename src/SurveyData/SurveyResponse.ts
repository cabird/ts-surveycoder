
export class SurveyResponse {
    private responseNumber: number;
    private responseId: string;
    // map from question Id to the answer
    private answerDict: Map<string, string>;

    public get ResponseNumber(): number {
        return this.responseNumber;
    }

    public get ResponseId(): string {
        return this.responseId;
    }

    constructor(responseNumber: number, responseId: string) {
        this.responseNumber = responseNumber;
        this.responseId = responseId;
        this.answerDict = new Map<string, string>();
    } 

    public GetAnswerForQuestion(QuestionId: string): string {
        if (this.answerDict.has(QuestionId)) {
            return this.answerDict.get(QuestionId)!;
        }
        return "";
    }

    public HasAnswerForQuestion(QuestionId: string): boolean {
        return this.answerDict.has(QuestionId);
    }

    public SetAnswerForQuestion(QuestionId: string, answer: string) {
        this.answerDict.set(QuestionId, answer);
    }

}