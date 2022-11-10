import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export class MenuItemInfo {
    id: string;
    label: string;
    //make a constructor that takes in the id and label
    constructor(id: string, label: string = id) {
        this.id = id;
        this.label = label;
    }
}

export interface MainAppBarProps {
    onMenuItemClick: (item: string) => void;
    menuItems: Array<MenuItemInfo>;
};

export function MainAppBar(props: MainAppBarProps) {
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
                                <MenuItem key={item.id} id={item.id} onClick={handleSelected}>{item.label}</MenuItem>
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


export default MainAppBar;