import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Breadcrumb, ButtonOne, ButtonTwo } from '../../../../../components';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';
import Layout from '../../../../../layout';
import { createDataPegawai, getMe } from '../../../../../config/redux/action';
import Swal from 'sweetalert2';

const FormAddDataPegawai = () => {
    const [formData, setFormData] = useState({
        namaPegawai: '',
        username: '',
        email: '',
        password: '',
        confPassword: '',
        groups: '',
        hak_akses: '',
    });

    const {
        namaPegawai,
        username,
        email,
        password,
        confPassword,
        groups,
        hak_akses,
    } = formData;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);

    const submitDataPegawai = (e) => {
        e.preventDefault();
        
        // We send a plain object now, not FormData, as we removed images
        // Auto-assign hak_akses based on group
        const calculatedAccess = groups === 'cluster-admin' ? 'admin' : 'pegawai';

        const data = {
            nama_pegawai: namaPegawai,
            username: username,
            email: email,
            password: password,
            confPassword: confPassword,
            groups: groups,
            hak_akses: calculatedAccess
        };

        dispatch(createDataPegawai(data, navigate))
            .then((response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: response.message,
                    showConfirmButton: false,
                    timer: 1500,
                });
                navigate("/users-data");
            })
            .catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: error.response?.data?.msg || error.message,
                    confirmButtonText: 'Ok',
                });
            });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            navigate('/login');
        }
        if (user && user.hak_akses !== 'admin') {
            navigate('/dashboard');
        }
    }, [isError, user, navigate]);

    return (
        <Layout>
            <Breadcrumb pageName='Add New Cluster User' />
            <div className='sm:grid-cols-2'>
                <div className='flex flex-col gap-9'>
                    <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                        <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                            <h3 className='font-medium text-black dark:text-white'>
                                Create User in Keycloak & Dashboard
                            </h3>
                        </div>
                        <form onSubmit={submitDataPegawai}>
                            <div className='p-6.5'>
                                <div className='mb-4.5 flex flex-col gap-6 xl:flex-row'>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Full Name <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            name='namaPegawai'
                                            value={namaPegawai}
                                            onChange={handleChange}
                                            required={true}
                                            placeholder='Enter full name'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Email Address <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='email'
                                            name='email'
                                            value={email}
                                            onChange={handleChange}
                                            required={true}
                                            placeholder='user@example.com'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                </div>
                                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Username <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            name='username'
                                            value={username}
                                            onChange={handleChange}
                                            required={true}
                                            placeholder='Enter username'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Cluster Group <span className='text-meta-1'>*</span>
                                        </label>
                                        <div className='relative z-20 bg-transparent dark:bg-form-input'>
                                            <select className='relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                                name='groups'
                                                value={groups}
                                                onChange={handleChange}
                                                required={true}
                                            >
                                                <option value='' disabled={true}>Select Group</option>
                                                <option value='cluster-admin'>Cluster Admin</option>
                                                <option value='devs'>Developers</option>
                                                <option value='viewers'>Viewers</option>
                                            </select>
                                            <span className='absolute top-1/2 right-4 z-30 -translate-y-1/2 text-2xl'>
                                                <MdOutlineKeyboardArrowDown />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Password <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='password'
                                            name='password'
                                            value={password}
                                            onChange={handleChange}
                                            required={true}
                                            placeholder='Enter password'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Confirm Password <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='password'
                                            name='confPassword'
                                            value={confPassword}
                                            onChange={handleChange}
                                            required={true}
                                            placeholder='Confirm password'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                        {confPassword && (
                                            <p className={`text-xs mt-1 font-bold ${password === confPassword ? 'text-success' : 'text-danger'}`}>
                                                {password === confPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* Dashboard Access is now automated based on Group */}

                                <div className='flex flex-col md:flex-row w-full gap-3 text-center mt-8'>
                                    <div>
                                        <ButtonOne  >
                                            <span>Create User</span>
                                        </ButtonOne>
                                    </div>
                                    <Link to="/users-data" >
                                        <ButtonTwo  >
                                            <span>Back</span>
                                        </ButtonTwo>
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default FormAddDataPegawai;
