import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../../../layout';
import Swal from 'sweetalert2';
import { Breadcrumb, ButtonOne } from '../../../../components';
import { TfiLock } from 'react-icons/tfi'
import { changePassword, getMe } from '../../../../config/redux/action';

const UbahPasswordAdmin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');

    const { isError, user, } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password === confPassword) {
            try {
                await dispatch(changePassword(password, confPassword));
                Swal.fire({
                    icon: 'success',
                    title: 'Password Updated',
                    text: 'Your password has been successfully updated !',
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/dashboard');
                    }
                });
                setPassword('');
                setConfPassword('');
            } catch (error) {
                console.error("Password Update UI Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: error.response?.data?.msg || 'Could not update password. Please check your connection to the identity provider.',
                    confirmButtonText: 'Try Again',
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Mismatch',
                text: 'The new password and confirmation password do not match.',
                confirmButtonText: 'OK',
            });
        }
    };

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            navigate('/login');
        }
    }, [isError, navigate]);

    return (
        <Layout>
            <Breadcrumb pageName='Change Password' />

            <div className='sm:grid-cols-2'>
                <div className='flex flex-col gap-9'>
                    <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                        <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                            <h3 className='font-medium text-black dark:text-white'>Security Settings</h3>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className='p-6.5'>
                                <div className='mb-4.5 '>
                                    <div className='w-full mb-4'>
                                        <label className='mb-4 block text-black dark:text-white'>
                                            New Password <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='password'
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder='Enter new password'
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                    <div className='w-full mb-4'>
                                        <label className='mb-4 block text-black dark:text-white'>
                                            Confirm New Password <span className='text-meta-1'>*</span>
                                        </label>
                                        <input
                                            type='password'
                                            placeholder='Repeat new password'
                                            value={confPassword}
                                            required
                                            onChange={(e) => setConfPassword(e.target.value)}
                                            className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                        />
                                    </div>
                                </div>

                                <div className='flex flex-col md:flex-row w-full gap-3 text-center'>
                                    <button
                                        type='submit'
                                        className='inline-flex items-center justify-center rounded-md bg-primary py-3 px-10 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10'
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default UbahPasswordAdmin;
