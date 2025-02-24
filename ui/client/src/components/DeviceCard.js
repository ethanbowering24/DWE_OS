import Warning from "@mui/icons-material/Warning";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import Collapse from '@mui/material/Collapse';

import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';

import React, { useEffect, useState } from "react";
import { LineBreak, makeAsyncPostRequest, makePostRequest, useDidMountEffect } from "../utils/utils";
import { Divider } from "@mui/material";

function SupportingText(props) {
    return (
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom marginBottom='14px'>
            {props.children}
        </Typography>
    )
}

function DeviceSwitch(props) {
    return (
        <FormControlLabel onChange={props.onChange} sx={{ mt: '-10px' }} control={<Switch name={props.name} checked={props.checked} />} label={
            <Typography color="text.secondary">{props.text}</Typography>
        } >{props.children}</FormControlLabel>
    )
}

const ResolutionMenu = (props) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    let [currentResolution, setCurrentResolution] = useState(props.defaultResolution);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useDidMountEffect(() => {
        props.onResolutionChange(currentResolution);
    }, [currentResolution]);

    return (
        <div>
            <Button color="grey" variant="contained"
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                Resolution: {currentResolution}
            </Button>
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
                    props.resolutions.map((item) => {
                        return <MenuItem onClick={function() { setCurrentResolution(item); handleClose(); }}>{item}</MenuItem>
                    })
                }
            </Menu>
        </div>
    );
}

const DeviceOptions = (props) => {
    const device = props.device.devicePath;

    const [bitrate, setBitrate] = useState(props.device.options.bitrate);
    const [bitrateSlider, setBitrateSlider] = useState(props.device.options.bitrate);
    const [h264, setH264] = useState(props.device.options.h264);
    const [vbr, setVBR] = useState(props.device.options.vbr);

    useDidMountEffect(() => {
        const body = {
            devicePath: device,
            options: {
                bitrate, h264, vbr
            }
        };
        makePostRequest('/options', body);
    }, [bitrate, h264, vbr]);

    return (
        <>
            <SupportingText>
                <span>Bitrate: {bitrateSlider} Mbps</span>
                <Slider name="bitrate" defaultValue={props.device.options.bitrate} disabled={vbr}
                    onChangeCommitted={(_, newValue) => { setBitrate(newValue) }} onChange={(_, newValue) => { setBitrateSlider(newValue) }}
                    style={{ marginLeft: '20px', width: 'calc(100% - 25px)' }} size="small" max={15} min={0.1} step={0.1} />
            </SupportingText>
            <FormGroup>
                <DeviceSwitch checked={h264} name="h264Switch" onChange={(e) => {
                    setH264(e.target.checked);
                    setVBR(e.target.checked ? false : vbr);
                }} text="H.264" />
                <DeviceSwitch checked={vbr} name="vbrSwitch" onChange={(e) => {
                    setVBR(e.target.checked);
                    setH264(e.target.checked ? false : h264);
                }} text="VBR (Variable Bitrate)" />
            </FormGroup>
        </>
    )
}

const StreamOptions = (props) => {
    const device = props.device.devicePath;

    const [udp, setUDP] = useState(props.device.stream.isStreaming);
    const [hostAddress, setHostAddress] = useState(props.device.stream.host);
    const [port, setPort] = useState(props.device.stream.port);
    const [resolution, setResolution] = useState(props.device.stream.resolution);

    const restartStream = () => {
        makePostRequest('/restartStream', {
            devicePath: device,
            stream: {
                hostAddress, port, resolution
            }
        }, (xhr) => {
            let response = JSON.parse(xhr.response);
            setPort(response.port);
        });
    }

    useDidMountEffect(() => {
        restartStream();
    }, [resolution]);

    useDidMountEffect(() => {
        if (udp) {
            makePostRequest('/addStream', {
                devicePath: device,
                stream: {
                    hostAddress, port
                }
            }, (xhr) => {
                let response = JSON.parse(xhr.response);
                setPort(response.port);
            });
        } else {
            makePostRequest('/removeStream', {
                devicePath: device
            });
        }
    }, [udp]);

    return (
        <FormGroup>
            <DeviceSwitch onChange={(e) => { setUDP(e.target.checked) }} checked={udp} name="streamSwitch" text="UDP Stream" />
            {
                udp ?
                    <>
                        <TextField label="address" onChange={(e) => { setHostAddress(e.target.value) }} variant="standard" value={hostAddress} />
                        <TextField label="port" onChange={(e) => { setPort(e.target.value) }} variant="standard" type="number" value={port} />
                        <div style={{ marginTop: '20px' }}>
                            <ResolutionMenu onResolutionChange={(res) => {
                                setResolution(res);
                            }} defaultResolution={resolution} resolutions={props.device.resolutions} />
                        </div>
                        <Button color="grey" variant="contained" style={{ marginTop: '20px' }} onClick={restartStream}>Restart Stream</Button>
                    </>
                    : undefined
            }
        </FormGroup>
    )
}

const CameraControls = (props) => {
    const controls = props.controls;
    const [controlsCollapsed, setControlsCollapsed] = useState(true);

    return <>
        <div style={{ marginTop: '25px' }}>
            <span>Camera Controls</span>
            <IconButton onClick={() => setControlsCollapsed(!controlsCollapsed)} >
                {controlsCollapsed ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
            </IconButton>
            <Divider />
            <Collapse in={!controlsCollapsed}>
   
                <FormGroup style={{ marginTop: '25px' }}>
                    {
                        controls.map((control, _) => {
                            switch (control.type) {
                                case 'int': {
                                    let { min, max, step, name, id } = control;
                                    let defaultValue = control.value;
                                    let [controlValue, setControlValue] = useState(defaultValue);
                                    useDidMountEffect(() => {
                                        makePostRequest('/setControl', {
                                            devicePath: props.devicePath, 
                                            id, 
                                            value: controlValue
                                        });
                                    }, [controlValue]);
                                    return <>
                                        <span>{name}</span>
                                        <Slider onChangeCommitted={(_, newValue) => {
                                            setControlValue(newValue);
                                        }} name={`control-${id}`} min={min} max={max} step={step} defaultValue={defaultValue} style={{ marginLeft: '20px', width: 'calc(100% - 25px)' }} />
                                    </>
                                }
                                case 'bool': {
                                    let { name, id } = control;
                                    let defaultValue = control.value;
                                    if(name.includes("White Balance")) {
                                        name = "AI TrueColor Technology™"
                                    }
                                    let [controlValue, setControlValue] = useState(defaultValue);
                                    useDidMountEffect(() => {
                                        makePostRequest('/setControl', {
                                            devicePath: props.devicePath, 
                                            id, 
                                            value: controlValue
                                        });
                                    }, [controlValue]);
                                    return <>
                                        <span>{name}</span>
                                        <Switch onChange={(_, checked) => {
                                            setControlValue(checked);
                                        }} name={`control-${id}`} defaultChecked={defaultValue == 1} />
                                    </>
                                }
                                case 'menu': {
                                    let { menu, name, id } = control;
                                    let defaultValue = menu[control.value];
                                    let [controlValue, setControlValue] = useState(defaultValue);
                                    useDidMountEffect(() => {
                                        makePostRequest('/setControl', {
                                            devicePath: props.devicePath, 
                                            id, 
                                            value: controlValue
                                        });
                                    }, [setControlValue]);
                                    return <>
                                        <PopupState variant="popover" popupId={id}>
                                            {(popupState) => (
                                                <>
                                                    <div>
                                                        <span>{name}: {controlValue}</span>
                                                        <IconButton variant="text" {...bindTrigger(popupState)}>
                                                            <ArrowDropDownIcon />
                                                        </IconButton>
                                                    </div>
                                                    <Menu {...bindMenu(popupState)}>
                                                        {
                                                            menu.map((item, _) => {
                                                                return <MenuItem onClick={() => {
                                                                    setControlValue(item);
                                                                    popupState.close();
                                                                }}>{item}</MenuItem>
                                                            })
                                                        }
                                                    </Menu>
                                                </>
                                            )}
                                        </PopupState>
                                    </>
                                }
                            }
                        })
                    }
                </FormGroup>
                <LineBreak />
                <Button color="grey" variant="contained"
                    onClick={async () => {
                        for (let control of controls) {
                            let id = control.id;
                            let defaultValue = control.default;
                            await makeAsyncPostRequest('/setControl', {
                                devicePath: props.devicePath, 
                                id, 
                                value: defaultValue
                            });
                        }
                        location.reload();
                    }}>Set to Default</Button>
            </Collapse>
        </div>
    </>
}

const DeviceCard = (props) => {
    const controls = props.device.controls;

    let deviceOptions;
    let deviceWarning;
    let cameraControls;
    if (props.device.caps.driver) {
        deviceOptions = <DeviceOptions device={props.device} />;
        cameraControls = <CameraControls controls={controls} devicePath={props.device.devicePath} />;
        deviceWarning = null;
    } else {
        deviceOptions = null;
        cameraControls = null;
        deviceWarning = (
            <Tooltip title="Device not compatible by DWE OS. Features will be limited.">
                <Icon>
                    <Warning />
                </Icon>
            </Tooltip>
        )
    }

    return (
        <Grid item xs={12} lg={6} xl={4} style={{ display:"flex", justifyContent:"center", padding: '20px' }}>
            <Card textAlign="left" sx={{ minWidth: 500, boxShadow: 3 }}>
                <CardHeader
                    action={deviceWarning}
                    title={props.device.info.name} subheader={
                        <>
                            {props.device.info.manufacturer ? `Manufacturer: ${props.device.info.manufacturer}` : undefined}
                            <LineBreak />
                            {props.device.info.model ? `Model: ${props.device.info.model}` : undefined}
                            <LineBreak />
                            <TextField onChange={(e) => { makePostRequest('/setDeviceName', {devicePath: props.device.devicePath, name: e.target.value}) }} helperText="Device Nickname" placeholder="Device Nickname" variant="standard" defaultValue={props.device.name}></TextField>
                        </>
                    } />
                <CardContent>
                    <SupportingText>Device: {props.device.devicePath}</SupportingText>
                    {deviceOptions}
                    <StreamOptions device={props.device} />
                    {cameraControls}
                    {props.children}
                </CardContent>
            </Card>
        </Grid>
    )
}

export default DeviceCard;
