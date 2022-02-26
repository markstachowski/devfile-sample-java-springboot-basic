import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from "redux";
import './index.css';
import App from './App';
import './gg-kendo-default.scss';
import './App.scss';
import reducer from './components/common/store/store';

import reportWebVitals from './reportWebVitals';
import ShowError from "./components/common/ShowError";
import {Provider} from "react-redux";
import {setDispatchRef} from "./components/common/api";

const gg_store = createStore(reducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() );
/*
    useDispatch()  hook can only be used in React components. But we need the access to
    dispatch in api.js functions. So setting the dispatch reference in api for later use.
 */
setDispatchRef(gg_store.dispatch);
ReactDOM.render(
    <React.StrictMode>
        <Provider store={gg_store}>

            <App/>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
