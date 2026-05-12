import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducer/authReducer';
import dataPegawaiReducer from './reducer/dataPegawaiReducer';
import dataJabatanReducer from './reducer/dataJabatanReducer';
import rbacReducer from './reducer/rbacReducer';

const store = configureStore({
    reducer: {
        auth: authReducer,
        dataPegawai: dataPegawaiReducer,
        dataJabatan: dataJabatanReducer,
        rbac: rbacReducer,
    },
});

export default store;
