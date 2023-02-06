
export class SurveyResponseCodes {
    // dictionary that maps a response id to a dictionary that maps 
    // the question id to the list of response codes for that response for that question
    private responseCodes: Map<string, Map<string, string[]>>;
    private questionCodes: Map<string, string[]>;

    constructor() {
        this.responseCodes = new Map<string, Map<string, string[]>>();
        this.questionCodes = new Map<string, string[]>();
    }

    private getResponseDict(responseId: string): Map<string, string[]> {
        if (!this.responseCodes.has(responseId)) {
            this.responseCodes.set(responseId, new Map<string, string[]>());
        }
        return this.responseCodes.get(responseId)!;

    }

    public addResponseCodeForResponseAndQuestion(responseId: string, questionId: string, responseCode: string) {
        const response = this.getResponseDict(responseId);
        const responseCodes = response.get(questionId) ?? [];
        response.set(questionId, [...responseCodes, responseCode]);

        const codes = this.questionCodes.get(questionId) ?? [];
        const newCodeSet = codes.concat(responseCodes.filter((code) => !codes.includes(code)));
        this.questionCodes.set(questionId, newCodeSet);
    }

    public setCodesForResponseAndQuestion(responseId: string, questionId: string, responseCodes: string[]) {
        const response = this.getResponseDict(responseId);
        response.set(questionId, responseCodes);

        const codes = this.questionCodes.get(questionId) ?? [];
        const newCodeSet = codes.concat(responseCodes.filter((code) => !codes.includes(code)));
        this.questionCodes.set(questionId, newCodeSet);
    }

    public getCodesForResponseAndQuestion(responseId: string, questionId: string): string[] {
        const response = this.getResponseDict(responseId);
        if (response.has(questionId)) {
            return response.get(questionId)!;
        }
        return [];
    }

    public hasCodesForQuestion(questionId: string): boolean {
        return this.questionCodes.has(questionId);
    }

    public getCodesForQuestion(questionId: string): string[] {
        if (this.questionCodes.has(questionId)) {
            return this.questionCodes.get(questionId)!;
        } else {
            return [];
        }
    }

    public getResponsesForCodeAndQuestion(code: string, questionId: string): string[] {
        const responses: string[] = [];
        this.responseCodes.forEach((response, responseId) => {
            const responseCodes = response.get(questionId);
            if (responseCodes && responseCodes.includes(code)) {
                responses.push(responseId);
            }
        });
        return responses;
    }

    public renameCodeForQuestion(questionId: string, oldCode: string, newCode: string) {
        const codes: string[] = this.questionCodes.get(questionId)!;
        //build a new code set consisting of all codes except the old code and the new code
        const newCodes = codes.filter((code) => code !== oldCode && code !== newCode);
        newCodes.push(newCode);
        this.questionCodes.set(questionId, newCodes);

        // now update all the responses
        this.responseCodes.forEach((response) => {
            const responseCodes = response.get(questionId);

            //we only need to do anything if the response has the old code for this question
            if (responseCodes && responseCodes.includes(oldCode)) {
                //remove the old code and then add the new code if it's not already in there (which is possible if the code already exists)
                const newCodes = responseCodes.filter((code) => code !== oldCode);
                if (!responseCodes.includes(newCode)) {
                    newCodes.push(newCode);
                }
                response.set(questionId, newCodes);
            }

        });
    }

    public mergeCodesForQuestion(questionId: string, codeToDelete: string, codeToKeep: string) {
        this.renameCodeForQuestion(questionId, codeToDelete, codeToKeep);
    }

}