import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import Layout from '../../../layout';
import { CardOne, CardTwo, CardThree, CardFour, ChartOne, ChartTwo, Breadcrumb } from '../../../components';
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";

const DefaultDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [dataPegawai, setDataPegawai] = useState(null);

    useEffect(() => {
        const getDataPegawai = async () => {
            try {
                const response = await axios.get(
                    `/api/data_pegawai/name/${user.nama_pegawai}`
                );
                const data = response.data;
                setDataPegawai(data);
            } catch (error) {
                console.log(error);
            }
        };

        if (user && user.hak_akses === "pegawai") {
            getDataPegawai();
        }
    }, [user]);


    return (
        <Layout>
            <Breadcrumb pageName='Dashboard' />
            {user && user.hak_akses === "admin" && (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5'>
                    <CardOne />
                    <CardTwo />
                    <CardThree />
                    <CardFour />
                </div>
            )}
            {user && user.hak_akses === "admin" && (
                <div className="mt-4 grid grid-cols-12 gap-6 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
                    <div className="col-span-12 sm:col-span-7">
                        <ChartOne />
                    </div>
                    <div className="col-span-12 sm:col-span-5">
                        <ChartTwo />
                    </div>
                </div>
            )}
            {user && user.hak_akses === "pegawai" && dataPegawai && (
                <>
                    <div className="mt-6">
                        <h2 className="px-4 py-2 text-meta-3 font-medium text-center md:text-left text-2xl">
                            Hello {dataPegawai.nama_pegawai}! Welcome to your KubeRBAC command center.
                        </h2>
                        <p className="px-4 text-gray-500 text-center md:text-left">
                            Here you can find your current cluster access credentials and permissions.
                        </p>
                    </div>
                    <div className="py-2 px-4 md:px-6 dark:border-strokedark text-lg mt-6">
                        <h3 className="font-medium text-black dark:text-white text-center md:text-left">
                            Access Credentials
                        </h3>
                    </div>
                    <div className="flex flex-col md:flex-row rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mt-2">
                        <div className="md:w-1/3 w-full px-4 py-8 flex justify-center items-center">
                            <div className='relative h-48 w-48 flex items-center justify-center bg-gray-200 dark:bg-meta-4 rounded-full text-gray-400 dark:text-gray-200'>
                                <FaUserCircle className='text-9xl' />
                            </div>
                        </div>
                        <div className="md:w-2/3 px-4 md:px-20 py-4 md:py-12">
                            <div className="w-full md:text-lg">
                                <h2 className="font-medium mb-4 block text-black dark:text-white">
                                    <span className="inline-block w-48">Reference ID</span>
                                    <span className="inline-block w-7">:</span>{dataPegawai.nik}
                                </h2>

                                <h2 className="font-medium mb-4 block text-black dark:text-white">
                                    <span className="inline-block w-48">Preferred Name</span>
                                    <span className="inline-block w-7">:</span>{dataPegawai.nama_pegawai}
                                </h2>
                                <h2 className="font-medium mb-4 block text-black dark:text-white">
                                    <span className="inline-block w-48">Email Address</span>
                                    <span className="inline-block w-7">:</span>{dataPegawai.email || 'N/A'}
                                </h2>
                                <h2 className="font-medium mb-4 block text-black dark:text-white">
                                    <span className="inline-block w-48">Group Membership</span>
                                    <span className="inline-block w-7">:</span>{dataPegawai.groups || 'None'}
                                </h2>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default DefaultDashboard;
