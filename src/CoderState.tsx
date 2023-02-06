import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { Survey, SurveyQuestion } from './SurveyData/Survey';
import { SurveyResponse } from './SurveyData/SurveyResponse';


interface CoderState {
    survey?: Survey;
    curQuestion?: SurveyQuestion;
    curSecondaryQuestion?: SurveyQuestion;
    curResponse?: SurveyResponse;
    codeSet: string[];
    selectedCodes: string[];
    rightClickedCode: string;
    renameDialogOpen: boolean;
    mergeCodesDialogOpen: boolean;
    mergeCode: string;
    mergeCodeSet: string[];
    snackbarOpen: boolean;
    snackbarMessage: string;
    snackbarSeverity: "success" | "info" | "warning" | "error";
    jumpToResponseNumDialogOpen: boolean;
    saveOpenAPIKeyDialogOpen: boolean;
}

interface CoderActions {
    setSurvey: (survey: Survey) => void;
    setCurQuestion: (question: SurveyQuestion) => void;
    setCurSecondaryQuestion: (question: SurveyQuestion) => void;
    setCurResponse: (response: SurveyResponse) => void;
    setCodeSet: (codeSet: string[]) => void;
    setSelectedCodes: (selectedCodes: string[]) => void;
    setJumpToResponseNumDialogOpen: (open: boolean) => void;
    setRenameDialogOpen: (open: boolean) => void;
    setMergeCodesDialogOpen: (open: boolean) => void;
    setRightClickedCode: (code: string) => void;
    setSaveOpenAPIKeyDialogOpen: (open: boolean) => void;
}


export const useCoderStore = create<CoderState & CoderActions>((set) => ({
    survey: undefined,
    curQuestion: undefined,
    curSecondaryQuestion: undefined,
    curResponse: undefined,
    codeSet: [],
    selectedCodes: [],
    rightClickedCode: "",
    renameDialogOpen: false,
    renameCode: "",
    mergeCodesDialogOpen: false,
    mergeCode: "",
    mergeCodeSet: [],
    snackbarOpen: false,
    snackbarMessage: "",
    snackbarSeverity: "success",
    jumpToResponseNumDialogOpen: false,
    saveOpenAPIKeyDialogOpen: false,

    setSurvey: (survey: Survey) => {
        set({ survey: survey });
    },
    setCurQuestion: (question: SurveyQuestion) => set(() => ({ curQuestion: question })),
    setCurSecondaryQuestion: (question: SurveyQuestion) => set(() => ({ curSecondaryQuestion: question })),
    setCurResponse: (response: SurveyResponse) => set(() => ({ curResponse: response })),
    setCodeSet: (codeSet: string[]) => set(() => ({ codeSet: codeSet })),
    setSelectedCodes: (selectedCodes: string[]) => set(() => ({ selectedCodes: selectedCodes })),
    setJumpToResponseNumDialogOpen: (open: boolean) => set(() => ({ jumpToResponseNumDialogOpen: open })),
    setSaveOpenAPIKeyDialogOpen: (open: boolean) => set(() => ({ saveOpenAPIKeyDialogOpen: open })),
    setRenameDialogOpen: (open: boolean) => set(() => ({ renameDialogOpen: open })),
    setMergeCodesDialogOpen: (open: boolean) => set(() => ({ mergeCodesDialogOpen: open })),
    setRightClickedCode: (code: string) => set(() => ({ rightClickedCode: code })),
}));




