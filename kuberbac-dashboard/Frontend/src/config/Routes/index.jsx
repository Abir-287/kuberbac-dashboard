import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NotFound from '../../components/molecules/NotFound'
import Home from '../../pages/Home';
import About from '../../pages/About';
import Contact from '../../pages/Contact';
import Login from '../../pages/Login';
import Dashboard from '../../pages/Dashboard';
import {
  FormAddDataJabatan,
  FormEditDataJabatan,
  FormAddDataPegawai,
  FormEditDataPegawai
} from '../../components';
import {
  DataPegawai,
  DataJabatan,
  ManageRbac,
  NamespacePods,
  UbahPasswordAdmin,
  ArgoCD,
  UserPermissions
} from '../../pages'

const AppRoutes = () => {
  return (

    <Routes>
      <Route path='/' element={<Navigate to='/login' replace />} />
      <Route path='/tentang' element={<About />} />
      <Route path='/kontak' element={<Contact />} />
      <Route path='/login' element={<Login />} />
      <Route path='/dashboard' element={<Dashboard />} />

      {/* Route Admin */}
      {/* Master Data Admin */}
      <Route
        path='/users-data'
        element={<DataPegawai />}
      />
      <Route
        path='/users-data/form-data-pegawai/add'
        element={<FormAddDataPegawai />}
      />
      <Route
        path='/users-data/form-data-pegawai/edit/:id'
        element={<FormEditDataPegawai />}
      />
      <Route
        path='/users-data/permissions/:username'
        element={<UserPermissions />}
      />
      <Route
        path='/namespaces-data'
        element={<DataJabatan />}
      />
      <Route
        path='/namespaces-data/form-data-jabatan/add'
        element={<FormAddDataJabatan />}
      />
      <Route
        path='/namespaces-data/form-data-jabatan/edit/:id'
        element={<FormEditDataJabatan />}
      />
      <Route
        path='/namespaces-data/rbac/:id'
        element={<ManageRbac />}
      />
      <Route
        path='/namespaces/:name/pods'
        element={<NamespacePods />}
      />
      <Route
        path='/argocd'
        element={<ArgoCD />}
      />

      {/* Settings */}
      <Route
        path='/change-password'
        element={<UbahPasswordAdmin />}
      />
      <Route
        path='/change-password-employee'
        element={<UbahPasswordAdmin />}
      />
      <Route
        path='/permissions'
        element={<UserPermissions isUserView={true} />}
      />

      {/* Route Not Found 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  )
}

export default AppRoutes;
