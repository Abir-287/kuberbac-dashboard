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
  FormAddDataKehadiran,
  FormEditDataKehadiran,
  FormAddDataPegawai,
  FormEditDataPegawai,
  FormAddDataPotongan,
  FormEditDataPotongan,
  PrintPdfLaporanGaji,
  DetailDataGaji,
  PrintPdfSlipGaji,
  PrintPdfLaporanAbsensi,
  PrintPdfDataGajiPegawai
} from '../../components';
import {
  DataPegawai,
  DataJabatan,
  DataKehadiran,
  DataGaji,
  ManageRbac,
  NamespacePods,
  LaporanGaji,
  LaporanAbsensi,
  SlipGaji,
  UbahPasswordAdmin,
  DataGajiPegawai,
  UbahPasswordPegawai,
  DataPotongan,
  ArgoCD
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

      {/* Transaksi Admin */}
      <Route
        path='/attendance-data'
        element={<DataKehadiran />}
      />
      <Route
        path='/attendance-data/form-data-kehadiran/add'
        element={<FormAddDataKehadiran />}
      />
      <Route
        path='/attendance-data/form-data-kehadiran/edit/:id'
        element={<FormEditDataKehadiran />}
      />
      <Route
        path='/deduction-data'
        element={<DataPotongan />}
      />
      <Route
        path='/deduction-data/form-data-potongan/add'
        element={<FormAddDataPotongan />} />
      <Route
        path='/deduction-data/form-data-potongan/edit/:id'
        element={<FormEditDataPotongan />} />
      <Route
        path='/salary-data'
        element={<DataGaji />}
      />
      <Route
        path='/salary-data/detail-data-gaji/name/:name'
        element={<DetailDataGaji />}
      />
      <Route
        path='/salary-data/cetak-gaji/slip-gaji/name/:name'
        element={<PrintPdfSlipGaji />}
      />

      {/* Laporan Admin */}
      <Route
        path='/report/salary'
        element={<LaporanGaji />}
      />
      <Route
        path='/report/salary/print-page'
        element={<PrintPdfLaporanGaji />}
      />
      <Route
        path='/report/attendance'
        element={<LaporanAbsensi />}
      />
      <Route
        path='/report/attendance/print-page'
        element={<PrintPdfLaporanAbsensi />}
      />
      <Route
        path='/report/salary-slip'
        element={<SlipGaji />}
      />
      <Route
        path='/report/salary-slip/print-page'
        element={<PrintPdfSlipGaji />}
      />

      {/* Pengaturan Admin */}
      <Route
        path='/change-password'
        element={<UbahPasswordAdmin />}
      />

      {/* Route Pegawai */}
      {/* Dashboard Data Gaji Pegawai */}
      <Route
        path='/permissions'
        element={<DataGajiPegawai />}
      />
      <Route
        path='/employee-salary-data/print-page'
        element={<PrintPdfDataGajiPegawai />}
      />
      <Route
        path='/change-password-employee'
        element={<UbahPasswordPegawai />}
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
