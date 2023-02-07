import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { Survey, SurveyQuestion } from "./SurveyData/Survey";
import { SurveyResponse } from "./SurveyData/SurveyResponse";



/* curl command
curl https://api.openai.com/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
  "model": "text-davinci-003",
  "prompt": "",
  "temperature": 0.7,
  "max_tokens": 256,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}'
*/
export class AskGPT {
    constructor() {

    }

    private static async MakeOpenAIRequest(query: string): Promise<string> {
        //get key from local web storage
        if (!localStorage.hasOwnProperty("OpenAI_API_Key"))
        {
            console.log("No key found in local storage. Please save your OpenAI API Key.");
            return "";
        }
        const openai_key = localStorage.getItem("OpenAI_API_Key");
        if (openai_key === null) {
            console.log("No key found in local storage. Please save your OpenAI API Key.");
            return "";
        }

        var url = "https://cbird-openai-west-europe.openai.azure.com/openai/deployments/text-davinci-003-deployment/completions?api-version=2022-12-01";
        const reqHeaders: Headers = new Headers();
        reqHeaders.append("Content-Type", "application/json");
        reqHeaders.append("api-key", openai_key);

        const requestInit: RequestInit = {
            method: "POST",
            headers: reqHeaders,
            body: JSON.stringify({
                "model": "text-davinci-003",
                "prompt": query,
                "temperature": 0.7,
                "max_tokens": 256,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }) as any
        };

        const response = await fetch(url, requestInit);
        const responseText = await response.text();
        return responseText;
    }

    public static async getCodeSuggestionsForResponse(survey: Survey, question: SurveyQuestion, response: SurveyResponse ): Promise<string[]> {
        // this implementation is likely inefficient, but it works.

        /* 
        1. get the set of all codes that have been used for this question.
        2. for each code, get the set of all responses that have that code.
        3  add a random set of 5 responses to a running set of responses, but avoid duplicates.
        4. for each response, get the set of all codes that have been used for that response.
        5. construct a query to send to GPT-3, using the response text and the codes.
        */

        const sample = this.getCodedResponsesSample(survey, question, 7, response);
        const fragments: string[] = [];

        //get the text for each of the responses in the sample.
        sample.forEach(responseId => {
            const response = survey.ResponseFromResponseId(responseId)!;
            const responseText = response.GetAnswerForQuestion(question.QuestionId);
            //assert(responseText !== undefined, "response text is undefined and it shouldn't be");
            const codes = survey.getCodesForResponseAndQuestion(response, question);
            const queryFragment = this.createQueryFragment(responseText, codes);
            fragments.push(queryFragment);
        });
       
        //create a query to send to GPT-3, using the response text and the codes.
        const query = "I need to assign labels to statements.  A statement may have multiple labels.\n" +
            "Here are some examples of the statements and labels\n\n"
            + fragments.join("\n\n") 
            + "\n\n"        
            + "Please assign labels to the following statement:\n"
            + response.GetAnswerForQuestion(question.QuestionId) + "\n\n";
        console.log(query);

        const gpt_response = await this.MakeOpenAIRequest(query);
        const gpt_response_json = JSON.parse(gpt_response);
        console.log(gpt_response_json);
        const gpt_response_text: string = gpt_response_json.choices[0].text;
        if (gpt_response_text.startsWith("Labels: ")) {
            const labels = gpt_response_text.substring("Labels: ".length).split(", ");
            console.log("Suggested labels: " + labels.join(", "));
            return labels;
        }

        return [];
    }

    private static createQueryFragment(responseText: string, codes: string[]): string {
        const query = "Statement: " + responseText + "\n" + "Labels: " + codes.join(", ");
        return query;
    }


    /* this gets a sample of response ids that should have a good mix of the difference codes.  It tried to get
    n responses for each code, but if there are fewer than n responses for a code, it will get all of them.  There
    will be no duplicates.
    */
    private static getCodedResponsesSample(survey: Survey, question: SurveyQuestion, n_per_code: number, response_to_exclude: SurveyResponse): Set<string> {

        const codes = survey.getCodesForQuestion(question);
        //loop over each of the codes, and get the set of responses that have that code.
        //create a dictionary mapping a code to the set of responses that have that code.
        const mainSample = new Set<string>();
        codes.forEach(code => {
            const responseIds = new Set<string>();
            survey.getResponsesForCodeAndQuestion(code, question).forEach(response => responseIds.add(response.ResponseId));

            if (responseIds.has(response_to_exclude.ResponseId)) {
                responseIds.delete(response_to_exclude.ResponseId);
            }
            
            //pick a random subset of n responses from the set of responseIds.
            const sampleSize = Math.min(n_per_code, responseIds.size);
            const sample = new Set<string>();
            while (sample.size < sampleSize) {
                const randomResponseId = Array.from(responseIds)[Math.floor(Math.random() * responseIds.size)];
                sample.add(randomResponseId);
                responseIds.delete(randomResponseId);
            }
            //add the sample to the main sample.
            sample.forEach(responseId => mainSample.add(responseId));
        });

        return mainSample;
    }

}