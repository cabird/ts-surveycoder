import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';


import { useCoderStore } from './CoderState';
import shallow from 'zustand/shallow';

export enum WhichQuestion {
    Primary,
    Secondary
}

interface QuestionSelectProps {
    whichQuestion: WhichQuestion;
    label: string;
}

const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 400,
        },
    },
};

export default function QuestionSelect(props: QuestionSelectProps) {

    const { survey, curQuestion, curSecondaryQuestion, setCurQuestion, setCurSecondaryQuestion } =
        useCoderStore(state => ({
            survey: state.survey,
            curQuestion: state.curQuestion,
            curSecondaryQuestion: state.curSecondaryQuestion,
            setCurQuestion: state.setCurQuestion,
            setCurSecondaryQuestion: state.setCurSecondaryQuestion
        }), shallow);

    const handleChange = (event: SelectChangeEvent) => {
        const questionId = event.target.value as string;
        const question = survey!.Questions.find((q) => q.QuestionId === questionId);
        if (question && props.whichQuestion === WhichQuestion.Primary) {
            setCurQuestion(question);
        } else if (question && props.whichQuestion === WhichQuestion.Secondary) {
            setCurSecondaryQuestion(question);
        }
    }

    let curQuestionId = "";
    if (props.whichQuestion === WhichQuestion.Primary) {
        curQuestionId = curQuestion?.QuestionId || "";
    } else {
        curQuestionId = curSecondaryQuestion?.QuestionId || "";
    }

    return (
        <Box sx={{ minWidth: 12 }}>
            <FormControl fullWidth>
                <InputLabel id="question-select-label">{props.label}</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={curQuestionId}
                    label="Question"
                    onChange={handleChange}
                    MenuProps={MenuProps}
                >
                    {survey?.Questions.map((q) => (
                        <MenuItem
                            style={{ whiteSpace: 'normal' }}
                            value={q.QuestionId}
                            key={q.QuestionId}>
                            {q.QuestionText}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}