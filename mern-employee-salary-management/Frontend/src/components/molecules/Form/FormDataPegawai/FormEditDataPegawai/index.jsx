import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';
import { Breadcrumb, ButtonOne, ButtonTwo } from '../../../../../components';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../../../../layout';
import axios from 'axios';
import { getMe } from '../../../../../config/redux/action';
import Swal from 'sweetalert2';

const FormEditDataPegawai = () => {
    const [namaPegawai, setNamaPegawai] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [groups, setGroups] = useState('');
    const [hakAkses, setHakAkses] = useState('');
    const [msg, setMsg] = useState('');
    const { id } = useParams();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);

    const updateUser = async (e) => {
        e.preventDefault();
        try {
            const data = {
                nama_pegawai: namaPegawai,
                username: username,
                email: email,
                groups: groups,
                hak_akses: hakAkses
            };

            // Using PATCH as defined in the backend routes
            const response = await axios.patch(`/api/data_pegawai/${id}`, data);
            Swal.fire({
                icon: 'success',
                title: 'Success',
                timer: 1500,
                text: response.data.msg
            });
            navigate('/users-data');
        } catch (error) {
            setMsg(error.response?.data?.msg || error.message);
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.response?.data?.msg || error.message
            });
        }
    };
    
    useEffect(() => {
        const getUserById = async () => {
            try {
                const response = await axios.get(`/api/data_pegawai/id/${id}`);
                const data = response.data;
                setNamaPegawai(data.nama_pegawai);
                setUsername(data.username);
                setEmail(data.email || '');
                setGroups(data.groups || '');
                setHakAkses(data.hak_akses);
            } catch (error) {
                if (error.response) {
                    setMsg(error.response.data.msg);
                }
            }
        };
        getUserById();
    }, [id]);

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
            <Breadcrumb pageName='Edit Cluster User' />
            <div className='sm:grid-cols-2'>
                <div className='flex flex-col gap-9'>
                    <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                        <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                            <h3 className='font-medium text-black dark:text-white'>
                                Edit User Details
                            </h3>
                        </div>
                        <form onSubmit={updateUser}>
                            <p className='text-meta-1 px-6.5 pt-4'>{msg}</p>
                            <div className='p-6.5'>
                                <div className='mb-4.5 flex flex-col gap-6 xl:flex-row'>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Full Name <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='text'
                                            value={namaPegawai}
                                            onChange={(e) => setNamaPegawai(e.target.value)}
                                            required={true}
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Email Address <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='email'
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required={true}
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
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required={true}
                                            disabled={true}
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full xl:w-1/2'>
                                        <label className='mb-2.5 block text-black dark:text-white'>
                                            Cluster Group <span className='text-meta-1'>*</span>
                                        </label>
                                        <div className='relative z-20 bg-transparent dark:bg-form-input'>
                                            <select className='relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                                value={groups}
                                                onChange={(e) => setGroups(e.target.value)}
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
                                            Dashboard Access <span className='text-meta-1'>*</span>
                                        </label>
                                        <div className='relative z-20 bg-transparent dark:bg-form-input'>
                                            <select className='relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                                value={hakAkses}
                                                onChange={(e) => setHakAkses(e.target.value)}
                                                required={true}
                                            >
                                                <option value='admin'>Admin</option>
                                                <option value='pegawai'>Limited</option>
                                            </select>
                                            <span className='absolute top-1/2 right-4 z-30 -translate-y-1/2 text-2xl'>
                                                <MdOutlineKeyboardArrowDown />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex flex-col md:flex-row w-full gap-3 text-center mt-8'>
                                    <div>
                                        <ButtonOne  >
                                            <span>Update User</span>
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
    );
};

export default FormEditDataPegawai;
