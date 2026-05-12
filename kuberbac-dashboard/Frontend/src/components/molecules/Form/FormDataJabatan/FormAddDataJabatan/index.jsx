import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../../../../layout';
import Swal from 'sweetalert2';
import { Breadcrumb, ButtonOne, ButtonTwo } from '../../../../../components';
import { createDataJabatan, getMe } from '../../../../../config/redux/action';

const FormAddDataJabatan = () => {
    const [namaJabatan, setNamaJabatan] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);

    const submitDataJabatan = (e) => {
        e.preventDefault();
        
        // We only need the name for K8s namespace creation
        const data = {
            nama_jabatan: namaJabatan
        };

        dispatch(createDataJabatan(data, navigate))
            .then((response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: "Namespace successfully created in cluster",
                    showConfirmButton: false,
                    timer: 1500,
                });
                navigate("/namespaces-data");
            })
            .catch((error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: error.response?.data?.message || error.message,
                    confirmButtonText: 'Ok',
                });
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
            <Breadcrumb pageName='Add New Namespace' />

            <div className='sm:grid-cols-2'>
                <div className='flex flex-col gap-9'>
                    <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                        <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                            <h3 className='font-medium text-black dark:text-white'>
                                Create Cluster Namespace
                            </h3>
                        </div>
                        <form onSubmit={submitDataJabatan}>
                            <div className='p-6.5'>
                                <div className='mb-4.5'>
                                    <label className='mb-2.5 block text-black dark:text-white'>
                                        Namespace Name <span className='text-meta-1'>*</span>
                                    </label>
                                    <input
                                        type='text'
                                        value={namaJabatan}
                                        onChange={(e) => setNamaJabatan(e.target.value)}
                                        required={true}
                                        placeholder='Enter namespace name (e.g. production-ns)'
                                        className='w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                                    />
                                </div>

                                <div className='flex flex-col md:flex-row w-full gap-3 text-center'>
                                    <div>
                                        <ButtonOne>
                                            <span>Create</span>
                                        </ButtonOne>
                                    </div>
                                    <Link to="/namespaces-data" >
                                        <ButtonTwo>
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

export default FormAddDataJabatan;
