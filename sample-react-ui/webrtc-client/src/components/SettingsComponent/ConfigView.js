import React , { useEffect } from 'react';

import './ConfigStyle.css';
import * as configDetails from './ConfigList';

function ConfigView() {

    const [ configValues, setConfigValues ] = React.useState([]);

    useEffect(() => {
        setConfigValues(configDetails.ConfigList);
    },[])
    return(
        <div className="config-header-div" style={{marginTop:80}}>
            <h2 className="config-header-h1">Configuration Details</h2>
            <div className="config-container">
                <div className="config-card">
                    {configValues.map((config, index) => {
                        const configData = config + ":";
                        return (
                            <div className="card-container">
                                <div className="div-container">
                                    <p className="p-config">{configData}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="config-card">
                    {configValues.map((config, index) => (
                        <div className="div-container">
                            <input type="text" placeholder={config} className="input"/>
                        </div>
                    ))}
                </div>
            </div>
            <div className="btn-div">
                <button className="submit-btn">save</button>
                <button className="submit-btn">reset</button>
            </div>
        </div>
    )
};
export default ConfigView;