import React, { useState, useEffect } from 'react';
import Layout from '../../../../layout';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Breadcrumb } from '../../../../components';
import { FaPlus, FaArrowLeft, FaKey } from 'react-icons/fa';
import { BsTrash3 } from 'react-icons/bs';
import Swal from 'sweetalert2';
import { 
    getUserPermissions, 
    getNamespaces, 
    getAvailableRoles, 
    createRoleBinding, 
    deleteRoleBinding,
    getDataPegawai
} from '../../../../config/redux/action';

const UserPermissions = ({ isUserView = false }) => {
    const { username: paramUsername } = useParams();
    const dispatch = useDispatch();
    const { isError, user } = useSelector((state) => state.auth);
    
    // If it's a user viewing their own permissions, use their auth username
    const username = isUserView ? user?.username : paramUsername;

    const { userPermissions, namespaces, availableRoles } = useSelector((state) => state.rbac);
    const { dataPegawai } = useSelector((state) => state.dataPegawai);
    
    // For view-only mode, we use the logged-in user's data directly from Auth state
    // to avoid calling the restricted getDataPegawai (admin only) API.
    const currentUser = isUserView ? user : dataPegawai.find(u => u.username === username);

    const [isLoading, setIsLoading] = useState(false);
    const [selectedNamespace, setSelectedNamespace] = useState('');
    const [selectedRoleString, setSelectedRoleString] = useState('');

    useEffect(() => {
        dispatch(getUserPermissions(username));
        
        // Only fetch administrative lists if we are in admin mode
        if (!isUserView) {
            dispatch(getNamespaces());
            dispatch(getAvailableRoles());
            if (dataPegawai.length === 0) {
                dispatch(getDataPegawai());
            }
        }
    }, [dispatch, username, isUserView, dataPegawai.length]);

    useEffect(() => {
        if (selectedNamespace) {
            dispatch(getAvailableRoles(selectedNamespace));
        }
    }, [dispatch, selectedNamespace]);

    const handleAddPermission = async (e) => {
        e.preventDefault();
        if (!selectedNamespace || !selectedRoleString) {
            return Swal.fire('Error', 'Please select both a namespace and a role', 'error');
        }

        const roleData = JSON.parse(selectedRoleString);
        
        // Generate a binding name using email if available, fallback to username
        const identity = currentUser?.email || username;
        const sanitizedUser = identity.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const bindingName = `${sanitizedUser}-${roleData.name}-binding`;

        setIsLoading(true);
        try {
            await dispatch(createRoleBinding(selectedNamespace, {
                username: username,
                roleName: roleData.name,
                roleKind: roleData.kind,
                bindingName: bindingName
            }));
            
            Swal.fire('Success', 'Permission granted successfully', 'success');
            setSelectedRoleString('');
            dispatch(getUserPermissions(username));
        } catch (error) {
            Swal.fire('Error', error.response?.data?.msg || 'Failed to grant permission', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (namespace, name) => {
        if (namespace === "All Namespaces (Cluster-wide)") {
            return Swal.fire('Protected', 'ClusterRoleBindings must be managed via kubectl or specific Cluster RBAC interface for safety.', 'info');
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Remove this permission in ${namespace}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteRoleBinding(namespace, name));
                Swal.fire('Deleted!', 'Permission removed.', 'success');
                dispatch(getUserPermissions(username));
            } catch (error) {
                Swal.fire('Error', 'Failed to delete permission', 'error');
            }
        }
    };

    return (
        <Layout>
            <Breadcrumb pageName={`User Permissions: ${username}`} />
            
            {!isUserView && (
                <Link 
                    to="/users-data"
                    className="inline-flex items-center gap-2 bg-danger text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 mb-6 transition"
                >
                    <FaArrowLeft /> Back to Users
                </Link>
            )}
            
            <div className='rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1'>
                
                <div className="flex items-center gap-3 mb-6">
                    <FaKey className="text-primary text-2xl" />
                    <div>
                        <h3 className='font-bold text-xl text-black dark:text-white'>
                            Manage Permissions for {currentUser?.nama_pegawai || username}
                        </h3>
                        {currentUser?.email && (
                            <p className="text-gray-5 text-sm">{currentUser.email}</p>
                        )}
                    </div>
                </div>

                {/* Add Permission Form (Admin Only) */}
                {!isUserView && (
                    <form onSubmit={handleAddPermission} className='flex flex-wrap gap-4 items-end mb-8 bg-gray-2 p-6 rounded-lg dark:bg-meta-4 border border-stroke dark:border-strokedark'>
                        <div className='flex-1 min-w-[200px]'>
                            <label className='block text-sm font-semibold mb-2'>Namespace</label>
                            <select 
                                value={selectedNamespace}
                                onChange={(e) => setSelectedNamespace(e.target.value)}
                                className='w-full rounded-lg border-[1.5px] border-stroke bg-white py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
                            >
                                <option value="">Select Namespace</option>
                                {namespaces.map(ns => (
                                    <option key={ns} value={ns}>{ns}</option>
                                ))}
                            </select>
                        </div>
                        <div className='flex-1 min-w-[200px]'>
                            <label className='block text-sm font-semibold mb-2'>Role</label>
                            <select 
                                value={selectedRoleString}
                                onChange={(e) => setSelectedRoleString(e.target.value)}
                                disabled={!selectedNamespace}
                                className='w-full rounded-lg border-[1.5px] border-stroke bg-white py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark disabled:opacity-50'
                            >
                                <option value="">Select Role</option>
                                {availableRoles.map(r => {
                                    const val = JSON.stringify(r);
                                    return (
                                        <option key={`${r.kind}-${r.name}`} value={val}>
                                            {r.name} ({r.kind})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading || !selectedRoleString}
                            className='bg-primary text-white py-2.5 px-8 rounded-lg font-bold hover:bg-opacity-90 flex items-center gap-2 transition disabled:opacity-50'
                        >
                            <FaPlus /> Grant Permission
                        </button>
                    </form>
                )}

                {/* Permissions Table */}
                <h3 className='font-semibold text-black dark:text-white mb-4 mt-8 flex items-center gap-2'>
                    Current Access Rights
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{userPermissions.length} Total</span>
                </h3>
                <div className='max-w-full overflow-x-auto mb-6'>
                    <table className='w-full table-auto'>
                        <thead>
                            <tr className='bg-gray-2 text-left dark:bg-meta-4 border-b border-stroke dark:border-strokedark'>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Namespace</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Role</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Assigned To</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className='text-center py-10 text-gray-5'>This user has no specific permissions in the cluster.</td>
                                </tr>
                            ) : (
                                userPermissions.map((p, index) => (
                                    <tr key={`${p.namespace}-${p.bindingName}-${index}`} className="hover:bg-gray dark:hover:bg-black/20 transition">
                                        <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.namespace === 'All Namespaces (Cluster-wide)' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                                                {p.namespace}
                                            </span>
                                        </td>
                                        <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black dark:text-white">{p.roleName}</span>
                                                <span className="text-xs text-gray-5">{p.kind}</span>
                                            </div>
                                        </td>
                                        <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black dark:text-white">{p.subjectName}</span>
                                                <code className="text-[10px] bg-gray-2 dark:bg-meta-4 px-1 rounded w-fit">{p.bindingName}</code>
                                            </div>
                                        </td>
                                        <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center'>
                                            {!isUserView && (
                                                <button 
                                                    onClick={() => handleDelete(p.namespace, p.bindingName)} 
                                                    className='text-danger hover:scale-110 transition p-2'
                                                    title="Revoke Permission"
                                                >
                                                    <BsTrash3 className="text-lg" />
                                                </button>
                                            )}
                                            {isUserView && (
                                                <span className="text-xs text-gray-5 italic">View Only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default UserPermissions;
