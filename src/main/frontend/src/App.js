import {BrowserRouter, Route, Routes} from "react-router-dom";
import React, {useEffect, useState, Suspense} from 'react';
import ShowError from "./components/common/ShowError";
import Layout from './components/Layout';

const Home = React.lazy(() => import('./components/Home'));
const DesignationAssignment = React.lazy(() => import('./pages/DesignationAssignment'));
const GiftCardAssignment = React.lazy(() => import('./pages/GiftCardAssignment'));
const UnprocessedGiftCards = React.lazy(() => import('./pages/UnprocessedGiftCards'));
const BulkDonations = React.lazy(() => import('./pages/BulkDonations'));
const CheckEntry = React.lazy(() => import('./pages/CheckEntry'));
const Help = React.lazy(() => import('./pages/Help'));

function App() {
    //added ask before losing data
    const [dirty, setDirty] = useState(true);

    useEffect(() => {
        window.onbeforeunload = function () {
            if (dirty) {
                return "Are you sure you want to navigate away?";
            }
        };
    }, [dirty]);

    function handleChange(e) {
        setDirty(!!e.target.value);
    }

    return (
        <div className="App">
            <ShowError/>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Layout/>}>
                            <Route path="/home" element={<Home/>}/>
                            <Route path="/gift-cards/designation" element={<DesignationAssignment/>}/>
                            <Route path="/gift-cards/assignment" element={<GiftCardAssignment/>}/>
                            <Route path="/gift-cards/unprocessed" element={<UnprocessedGiftCards/>}/>
                            <Route path="/bulk-donations" element={<BulkDonations/>}/>
                            <Route path="/check-entry" element={<CheckEntry/>}/>
                            <Route path="/help" element={<Help/>}/>
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </div>
    );
}

export default App;
