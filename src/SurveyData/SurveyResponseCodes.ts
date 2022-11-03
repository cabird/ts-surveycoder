
export class SurveyResponseCodes {
    // dictionary that maps a response id to a dictionary that maps 
    // the question id to the list of response codes for that response for that question
    private responseCodes: Map<string, Map<string, string[]>>;

    constructor() {
        this.responseCodes = new Map<string, Map<string, string[]>>();
    }

    private getResponseDict(responseId: string): Map<string, string[]> {
        if (!this.responseCodes.has(responseId)) {
            this.responseCodes.set(responseId, new Map<string, string[]>());
        }
        return this.responseCodes.get(responseId)!;
        
    }

    public addResponseCodeForResponseAndQuestion(responseId: string, questionId: string, responseCode: string) {
        const response = this.getResponseDict(responseId);
        if (response.has(questionId)) {
            response.get(questionId)?.push(responseCode);
        } else {
            response.set(questionId, [responseCode]);
        }
    }

    public setResponseCodesForResponseAndQuestion(responseId: string, questionId: string, responseCodes: string[]) {
        const response = this.getResponseDict(responseId);
        response.set(questionId, responseCodes);
    }

    public getResponseCodesForResponseAndQuestion(responseId: string, questionId: string): string[] {
        const response = this.getResponseDict(responseId);
        if (response.has(questionId)) {
            return response.get(questionId)!;
        }
        return [];
    }

    public getCodesForQuestion(questionId: string): string[] {
        const codes: string[] = [];
        this.responseCodes.forEach((response) => {
            if (response.has(questionId)) {
                response.get(questionId)?.forEach((code) => {
                    if (!codes.includes(code)) {
                        codes.push(code);
                    }
                });
            }
        });
        return codes;
    }

}