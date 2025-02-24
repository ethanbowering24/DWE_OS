import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import IconButton from '@mui/material/IconButton';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiLockIcon from '@mui/icons-material/WifiLock';
import SignalWifi4Bar from '@mui/icons-material/SignalWifi4Bar';
import CheckIcon from '@mui/icons-material/Check';
import React, { useLayoutEffect, useState } from 'react';
import { Button, Grid, Modal, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { LineBreak, networkConnect } from '../utils/utils';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function WifiConnection(props) {
    let Icon = SignalWifi4Bar;
    if (props.locked) {
        Icon = WifiLockIcon;
    }
    return (
        <IconButton>
            {props.isConnected ? <CheckIcon></CheckIcon> : undefined}
            <Icon sx={{ marginRight: 1 }} />
            {props.ssid}
        </IconButton>
    )
}

export default function WifiMenu(props) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [wifiModalOpen, setWifiModalOpen] = useState(false);
    const [selectedWifi, setSelectedWifi] = useState(null);
    const [passwordField, setPasswordField] = useState(null);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [connectedNetwork, setConnectedNetwork] = useState(null);
    
    const updateConnectedNetwork = () => {
        fetch('/connectedNetwork')
        .then((response) => response.json())
        .then((network) => {
            setConnectedNetwork(network.network);
        });
    }

    useLayoutEffect(() => {
        updateConnectedNetwork();
    }, []);

    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [connectedWifiNetworks, setConnectedWifiNetworks] = useState([]);
    const [availableWifiNetworks, setAvailableWifiNetworks] = useState([]);
    useLayoutEffect(() => {
        fetch('/networks')
        .then((response) => response.json())
        .then((networks) => {
            setConnectedNetwork(networks.find((network) => network.ssid == connectedNetwork));
            setConnectedWifiNetworks(<>
                <MenuItem onClick={function() {
                        setSelectedWifi(connectedNetwork.ssid);
                        setRequiresPassword(connectedNetwork.requiresPasskey);
                        setWifiModalOpen(true);
                        handleClose();
                    }}>
                    <WifiConnection ssid={connectedNetwork?.ssid} locked={connectedNetwork?.requiresPasskey} />
                </MenuItem>
            </>);
            setAvailableWifiNetworks(networks.map((network) => {
                if (connectedNetwork == network.ssid) return undefined;
                return <>
                    <MenuItem onClick={function() {
                            setSelectedWifi(network.ssid);
                            setRequiresPassword(network.requiresPasskey);
                            setWifiModalOpen(true);
                            handleClose();
                        }}>
                        <WifiConnection ssid={network.ssid} locked={network.requiresPasskey} isConnected={connectedNetwork == network.ssid} />
                    </MenuItem>
                </>
            }));
        });
    }, [connectedNetwork]);
    
    return (
        <div>
            {/* <Typography>Connected Network: {connectedNetwork}</Typography> */}
            <IconButton id="wifi-menu-button" aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <WifiIcon />
            </IconButton>
            <Menu id="wifi-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'wifi-menu-button',
                }}>
                <Typography sx={{marginLeft: 2}}>Active Connections</Typography>
                { connectedWifiNetworks }
                <Typography sx={{marginLeft: 2}}>Available Connections</Typography>
                { availableWifiNetworks }
            </Menu>
            <Modal
                open={wifiModalOpen}
                onClose={() => { setWifiModalOpen(false) }}
            >
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2">
                        Enter a password for the network: "{selectedWifi}"
                    </Typography>
                    {
                        requiresPassword ? <TextField type="password" label="Password" variant="standard" onChange={function(e) {
                            setPasswordField(e.target.value);
                        }} /> : null
                    }
                    <LineBreak />
                    <Grid sx={{marginTop: 1}} container alignItems="center" justifyContent="center">
                        <Button sx={{width: '40%', margin: 1}} variant="contained" onClick={function() {
                            setWifiModalOpen(false);
                        }}>Cancel</Button>
                        <Button sx={{width: '40%', margin: 1}} variant="contained" onClick={function() {
                            networkConnect(selectedWifi, passwordField);
                            setPasswordField(null);
                            setWifiModalOpen(false);

                            // TODO: Switch to websocket for wifi
                            let numTries = 5;
                            let interval = setInterval(() => {
                                updateConnectedNetwork();
                                numTries--;
                                if (connectedNetwork === selectedWifi || numTries === 0) {
                                    clearInterval(interval);
                                }
                            }, 2000);
                        }}>Connect</Button>
                    </Grid>
                </Box>
            </Modal>
        </div>
    );
}