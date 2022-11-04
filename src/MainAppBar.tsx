import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { PropaneRounded } from '@mui/icons-material';

interface MainAppBarProps {
    onMenuItemClick: (item: string) => void;
    menuItems: Array<string>;
};


function MainAppBar(props: MainAppBarProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event: React.MouseEvent<HTMLLIElement>) => {
        console.log("handleClose");
        console.log(event);
        setAnchorEl(null);
    };

    const handleSelected = (event: React.MouseEvent) => {
        props.onMenuItemClick(event.currentTarget.id);
        setAnchorEl(null);
    };

    return (

            <AppBar position="relative">
                <Toolbar>
                    
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2, flexGrow: 0 }}
                        
                        onClick={handleClick}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        {

                            props.menuItems.map((item) => {
                                return (
                                    <MenuItem key={item} id={item} onClick={handleSelected}>{item}</MenuItem>
                                );
                            })
                        }
                    </Menu>
                    <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
                        SurveyCoder
                    </Typography>

                </Toolbar>
            </AppBar>


    );
}
/*
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        News
                    </Typography>
                    <Button color="inherit">Login</Button>
                    

                    <Box sx={{ flexGrow: 1, width: 1000 }}>
                    <AppBar position="relative">
                        <Toolbar>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                sx={{ mr: 2 }}
                                onClick={handleClick}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                {
        
                                    props.menuItems.map((item) => {
                                        return (
                                            <MenuItem key={item} id={item} onClick={handleSelected}>{item}</MenuItem>
                                        );
                                    })
                                }
                            </Menu>
                            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
                                SurveyCoder
                            </Typography>
        
                        </Toolbar>
                    </AppBar>
                </Box> */
export default MainAppBar;