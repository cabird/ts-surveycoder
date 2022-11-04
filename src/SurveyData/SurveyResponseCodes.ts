
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
        if (response.has(questionId)) {
            response.get(questionId)?.push(responseCode);
        } else {
            response.set(questionId, [responseCode]);
        }

        // make sure that the set of question codes for this question has all the codes that were passed in.
        // this makes it hard to delete a code from a question, but that's not a use case we need to support.
        if (!this.questionCodes.has(questionId)) {
            this.questionCodes.set(questionId, [responseCode]);
        } else {
            const codes = this.questionCodes.get(questionId);
            if (!codes?.includes(responseCode)) {
                codes?.push(responseCode);
            }
        }
    }

    public setCodesForResponseAndQuestion(responseId: string, questionId: string, responseCodes: string[]) {
        const response = this.getResponseDict(responseId);
        response.set(questionId, responseCodes);
        
        // make sure that the set of question codes for this question has all the codes that were passed in.
        // this makes it hard to delete a code from a question, but that's not a use case we need to support.
        if (!this.questionCodes.has(questionId)) {
            this.questionCodes.set(questionId, responseCodes);
        } else {
            const codes = this.questionCodes.get(questionId);
            responseCodes.forEach((code) => {
                if (!codes?.includes(code)) {
                    codes?.push(code);
                }
            });
        }
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

    public renameCodeForQuestion(questionId: string, oldCode: string, newCode: string) {
        const codes: string[] = this.questionCodes.get(questionId)!;
        if (codes.includes(newCode)) {
            codes.splice(codes.indexOf(oldCode), 1);
        } else
        {
            codes[codes.indexOf(oldCode)] = newCode;
        }
        this.questionCodes.set(questionId, codes);
        
        this.responseCodes.forEach((response) => {
            if (response.has(questionId)) {
                const responseCodes = response.get(questionId)!;
                if (responseCodes.includes(newCode)) {
                    responseCodes.splice(responseCodes.indexOf(oldCode), 1);
                } else
                {
                    responseCodes[responseCodes.indexOf(oldCode)] = newCode;
                }
                response.set(questionId, responseCodes);
            }
        });
    }

    public mergeCodesForQuestion(questionId: string, codeToDelete: string, codeToKeep: string) {
        this.renameCodeForQuestion(questionId, codeToDelete, codeToKeep);
    }

}