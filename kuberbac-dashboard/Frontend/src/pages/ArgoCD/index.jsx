import React, { useEffect, useState } from 'react';
import Layout from '../../layout';
import { Breadcrumb } from '../../components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../../config/redux/action';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';

const ArgoCD = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(true);

    // Use the Ingress hostname (MetalLB + NGINX Ingress)
    const argoCDUrl = "https://argocd.abir.local";
    const githubRepoUrl = "https://github.com/Abir-287/kuberbac-dashboard";

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            navigate("/login");
        }
    }, [isError, navigate]);

    return (
        <Layout>
            <Breadcrumb pageName="ArgoCD Interface" />

            <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                        <h3 className="font-medium text-black dark:text-white">
                            Continuous Delivery Management
                        </h3>
                    </div>

                    <div className="p-4 md:p-6 xl:p-9 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                                <FiExternalLink className="text-primary text-4xl" />
                            </div>
                        </div>
                        
                        <h4 className="text-xl font-bold text-black dark:text-white mb-4">
                            External Authentication Required
                        </h4>
                        
                        <div className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 mb-8 space-y-4">
                            <p>
                                To protect your session from <strong>Clickjacking attacks</strong>, your Single Sign-On Identity Provider (Keycloak/Dex) strictly prohibits embedding its login screen inside other applications.
                            </p>
                            <p>
                                Because of these strict security measures, attempting to load ArgoCD inside this dashboard causes the authentication system to forcefully break out of the page. This interrupts your current session and forces you to log in again.
                            </p>
                            <p className="font-medium text-black dark:text-white">
                                To ensure a stable and secure experience, please manage your cluster deployments by opening ArgoCD in a new, dedicated tab.
                            </p>
                        </div>

                        <a
                            href={argoCDUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-3 px-8 text-center font-medium text-white hover:bg-opacity-90 shadow-md transition-all hover:scale-105"
                        >
                            <FiExternalLink className="text-xl" />
                            Open ArgoCD Securely
                        </a>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ArgoCD;
