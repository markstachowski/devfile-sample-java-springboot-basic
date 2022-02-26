import * as React from 'react';
import {AppBar, AppBarSection, AppBarSpacer, Avatar, Menu, MenuItem} from '@progress/kendo-react-layout';
import {Outlet, useNavigate} from "react-router-dom";
import {useEffect, useState} from 'react';
import {getData} from './common/api';
import {formatDate} from '@telerik/kendo-intl';
import logo from './../images/gg_logo.png'  ;

const Layout = () => {

    const navigate = useNavigate();

    const onSelect = event => {
        console.log('navigate to :' + event.item.data.route);
        if (event.item.data.route) {
            navigate(event.item.data.route);
        }
    };

    const [buildProperties, setBuildProperties] = useState({});
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        getData('/api/build-properties', {}, setBuildProperties);
        getData('/api/user-info', {}, setUserInfo);
    }, []);

    return (
        <>
            <AppBar themeColor={'inherit'}>
                <AppBarSection>
                    <a href={process.env.PUBLIC_URL}>
                        <img src={logo} width={150} />
                    </a>
                    <h5 style={{margin: 10}}>Staff Dashboard</h5>
                </AppBarSection>

                <AppBarSpacer style={{width: 30}}/>

                <AppBarSection>
                    <Menu onSelect={onSelect}>
                        <MenuItem text="Home" data={{
                            route: '/home'
                        }}/>
                        <MenuItem text="Gift Cards" data={{}}>
                            <MenuItem text="Designation Assignment" data={{
                                route: '/gift-cards/designation'
                            }}/>
                            <MenuItem text="Gift Card Assignment" data={{
                                route: '/gift-cards/assignment'
                            }}/>
                            <MenuItem text="Unprocessed Gift Cards" data={{
                                route: '/gift-cards/unprocessed'
                            }}/>
                        </MenuItem>
                        <MenuItem text="Bulk Donations" data={{
                            route: '/bulk-donations'
                        }}/>
                        <MenuItem text="Check Entry" data={{
                            route: '/check-entry'
                        }}/>
                        <MenuItem text="Help" data={{
                            route: '/help'
                        }}/>
                    </Menu>
                </AppBarSection>

                <AppBarSpacer />

                <AppBarSection className="actions">
                <span>
                    Version: {buildProperties.version}-{formatDate(new Date(buildProperties.time), 'yyyy-MM-dd HH-mm-ss')}
                </span>
                </AppBarSection>

                <AppBarSection>
                    <span className="k-appbar-separator" />
                </AppBarSection>

                <AppBarSection>
                    {userInfo.username &&
                        <Avatar type="text" style={{marginRight: 5}}>
                            {userInfo.username.slice(0, 2).toUpperCase()}
                        </Avatar>
                    }
                </AppBarSection>
            </AppBar>

            <Outlet/>
        </>
    )
};

export default Layout;
