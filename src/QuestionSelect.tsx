import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import {SurveyQuestion} from './SurveyData/Survey';

interface QuestionSelectProps {
    options: SurveyQuestion[];
    handleChange: (event: SelectChangeEvent) => void;
}

export default function QuestionSelect(props: QuestionSelectProps) {
    const [question, setQuestion] = React.useState(props.options.length > 0 ? props.options[0].QuestionId : '');

    const handleChange = (event: SelectChangeEvent) => {
        setQuestion(event.target.value as string);
        props.handleChange(event);
    }

    return (
        <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth>
            <InputLabel id="question-select-label">Question</InputLabel>
            <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={question}
            label="Question"
            onChange={handleChange}
            >
            {props.options.map((option) => (
                <MenuItem value={option.QuestionId} key={option.QuestionId}>{option.QuestionText}</MenuItem>
            ))}
            </Select>
        </FormControl>
        </Box>
    );
}