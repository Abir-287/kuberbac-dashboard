import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../../../../layout';
import axios from 'axios';
import { Breadcrumb, ButtonTwo } from '../../../../../components';
import { getMe } from '../../../../../config/redux/action';

const FormEditDataJabatan = () => {
    const [nsData, setNsData] = useState(null);
    const { id } = useParams();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const { isError, user } = useSelector((state) => state.auth);

    useEffect(() => {
        const getNamespace = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/data_jabatan/${id}`, { withCredentials: true });
                setNsData(response.data);
            } catch (error) {
                console.error("Error fetching namespace:", error);
            }
        }
        getNamespace();
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

    if (!nsData) return <div>Loading...</div>;

    return (
        <Layout>
            <Breadcrumb pageName='Namespace Details' />

            <div className='sm:grid-cols-2'>
                <div className='flex flex-col gap-9'>
                    <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
                        <div className='border-b border-stroke py-4 px-6.5 dark:border-strokedark'>
                            <h3 className='font-medium text-black dark:text-white'>
                                Namespace Information
                            </h3>
                        </div>
                        <div className='p-6.5'>
                            <div className='mb-4.5'>
                                <label className='mb-2.5 block text-black dark:text-white font-bold'>
                                    Namespace Name:
                                </label>
                                <p className='text-lg'>{nsData.nama_jabatan}</p>
                            </div>
                            <div className='mb-4.5'>
                                <label className='mb-2.5 block text-black dark:text-white font-bold'>
                                    Status:
                                </label>
                                <p className='text-lg'>{nsData.gaji_pokok}</p>
                            </div>
                            <div className='mb-4.5'>
                                <label className='mb-2.5 block text-black dark:text-white font-bold'>
                                    Creation Date:
                                </label>
                                <p className='text-lg'>{new Date(nsData.tj_transport).toLocaleString()}</p>
                            </div>
                            <div className='mb-4.5'>
                                <label className='mb-2.5 block text-black dark:text-white font-bold'>
                                    UID:
                                </label>
                                <p className='text-lg'>{nsData.uang_makan}...</p>
                            </div>
                            <div className='flex flex-col md:flex-row w-full gap-3 text-center'>
                                <Link to="/namespaces-data" >
                                    <ButtonTwo>
                                        <span>Back</span>
                                    </ButtonTwo>
                                </Link>
                                <Link to={`/namespaces-data/rbac/${nsData.id}`} className='bg-success text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90'>
                                    Manage RBAC
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default FormEditDataJabatan;
