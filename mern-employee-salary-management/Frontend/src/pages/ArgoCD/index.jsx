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
    
    // Placeholder ArgoCD URL - User can change this to their actual ArgoCD instance
    const argoCDUrl = "https://argocd.example.com"; 

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            navigate("/login");
        }
    }, [isError, navigate]);

    const handleRefresh = () => {
        setIsLoading(true);
        const iframe = document.getElementById('argocd-iframe');
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    return (
        <Layout>
            <Breadcrumb pageName="ArgoCD Interface" />
            
            <div className="flex flex-col gap-5 md:gap-7 2xl:gap-10">
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                        <h3 className="font-medium text-black dark:text-white">
                            Continuous Delivery Management
                        </h3>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleRefresh}
                                className="inline-flex items-center justify-center gap-2.5 rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90 lg:px-6 xl:px-8"
                            >
                                <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
                                Refresh
                            </button>
                            <a 
                                href={argoCDUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-6 xl:px-8"
                            >
                                <FiExternalLink />
                                Open Externally
                            </a>
                        </div>
                    </div>
                    
                    <div className="p-4 md:p-6 xl:p-9">
                        <div className="relative w-full overflow-hidden rounded-xl border border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4" style={{ height: 'calc(100vh - 350px)' }}>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white dark:bg-boxdark bg-opacity-70 dark:bg-opacity-70">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                                </div>
                            )}
                            <iframe 
                                id="argocd-iframe"
                                src={argoCDUrl} 
                                title="ArgoCD Interface"
                                className="w-full h-full border-0"
                                onLoad={() => setIsLoading(false)}
                                onError={() => setIsLoading(false)}
                            />
                        </div>
                        
                        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
                            Note: If the interface does not load, please ensure that ArgoCD is configured to allow embedding in iframes or use the "Open Externally" button.
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ArgoCD;
