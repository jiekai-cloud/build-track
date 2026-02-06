import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ContractSigningPage from './pages/ContractSigningPage';

const MainRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* 簽名頁面路由 */}
                <Route path="/contract/sign/:id" element={<ContractSigningPage />} />

                {/* 主系統路由 - 匹配所有其他路徑 */}
                <Route path="/*" element={<App />} />
            </Routes>
        </BrowserRouter>
    );
};

export default MainRouter;
