import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { TypePage } from './type/index.js';
import { ProtectedRoute } from '../../components/ProtectedRoute/index.js';

export function ConnectRoutes(): ReactElement {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<IndexPage />} path="/" />
      </Route>
      <Route element={<TypePage />} path="/:type/:id" />
      <Route element={<Navigate to="/apps" />} path="*" />
    </Routes>
  );
}
