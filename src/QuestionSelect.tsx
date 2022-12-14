import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SurveyQuestion } from './SurveyData/Survey';
import Divider from '@mui/material/Divider';

interface QuestionSelectProps {
    selectedQuestionId: string;
    options: SurveyQuestion[];
    handleChange: (event: SelectChangeEvent) => void;
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
    const [question, setQuestion] = React.useState(props.selectedQuestionId);

    // check if the selected question is in the list of options
    // if not, set the question to the first option
    if (props.options.findIndex((q) => q.QuestionId === question) === -1) {
        setQuestion(props.options[0].QuestionId);
    }

    const handleChange = (event: SelectChangeEvent) => {
        setQuestion(event.target.value as string);
        props.handleChange(event);
    }

    return (
        <Box sx={{ minWidth: 12 }}>
            <FormControl fullWidth>
                <InputLabel id="question-select-label">{props.label}</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={question}
                    label="Question"
                    onChange={handleChange}
                    MenuProps={MenuProps}
                >
                    {props.options.map((option) => (
                        <MenuItem
                            style={{ whiteSpace: 'normal' }}
                            value={option.QuestionId}
                            key={option.QuestionId}>
                            {option.QuestionText}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}