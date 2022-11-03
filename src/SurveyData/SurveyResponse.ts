
export class SurveyResponse {
    private responseNumber: number;
    private responseId: string;
    // map from question text to the answer
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

    public GetAnswerForQuestion(questionName: string): string {
        if (this.answerDict.has(questionName)) {
            return this.answerDict.get(questionName)!;
        }
        return "<NONE>";
    }

    public HasAnswerForQuestion(questionName: string): boolean {
        return this.answerDict.has(questionName);
    }

    public SetAnswerForQuestion(questionName: string, answer: string) {
        this.answerDict.set(questionName, answer);
    }

}