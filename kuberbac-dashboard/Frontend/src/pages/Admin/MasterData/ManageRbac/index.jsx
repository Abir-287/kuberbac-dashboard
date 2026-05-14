import React, { useState, useEffect } from 'react';
import Layout from '../../../../layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Breadcrumb } from '../../../../components';
import Swal from 'sweetalert2';
import { BsTrash3 } from 'react-icons/bs';
import { FaPlus, FaArrowLeft, FaUsers, FaUser, FaFilter } from 'react-icons/fa';
import { 
    getAvailableRoles, 
    createRoleBinding, 
    deleteRoleBinding,
    getDataPegawai,
    getRoleBindings
} from '../../../../config/redux/action';

const ManageRbac = () => {
    const { id: namespace } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { userPermissions: bindings, availableRoles, error } = useSelector((state) => state.rbac);
    const { dataPegawai: users } = useSelector((state) => state.dataPegawai);
    
    // Binding form state
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedRoleString, setSelectedRoleString] = useState('');
    const [subjectKind, setSubjectKind] = useState('User'); // 'User' or 'Group'
    
    // UI state
    const [filterGroup, setFilterGroup] = useState('All');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dispatch(getRoleBindings(namespace));
        dispatch(getAvailableRoles(namespace));
        if (users.length === 0) {
            dispatch(getDataPegawai());
        }
    }, [dispatch, namespace, users.length]);

    const handleAddBinding = async (e) => {
        e.preventDefault();
        if (!selectedSubject || !selectedRoleString) {
            return Swal.fire('Error', 'Please select both a target and a role', 'error');
        }

        const roleData = JSON.parse(selectedRoleString);
        
        // Generate binding name
        const sanitizedSubject = selectedSubject.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const bindingName = `${sanitizedSubject}-${roleData.name}-binding`;

        setIsLoading(true);
        try {
            await dispatch(createRoleBinding(namespace, {
                username: selectedSubject,
                roleName: roleData.name,
                roleKind: roleData.kind,
                bindingName: bindingName,
                subjectKind: subjectKind
            }));
            
            Swal.fire('Success', 'Role assigned successfully', 'success');
            setSelectedSubject('');
            setSelectedRoleString('');
            dispatch(getRoleBindings(namespace));
        } catch (error) {
            Swal.fire('Error', error.response?.data?.msg || 'Failed to assign role', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (name) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Remove permission "${name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteRoleBinding(namespace, name));
                Swal.fire('Deleted!', 'Permission removed.', 'success');
                dispatch(getRoleBindings(namespace));
            } catch (error) {
                Swal.fire('Error', 'Failed to delete permission', 'error');
            }
        }
    };

    // Filter users list if subjectKind is User
    const filteredUsers = users.filter(u => {
        if (filterGroup === 'All') return true;
        return u.groups?.includes(filterGroup);
    });

    return (
        <Layout>
            <Breadcrumb pageName={`Namespace RBAC: ${namespace}`} />
            
            <Link 
                to="/namespaces-data"
                className="inline-flex items-center gap-2 bg-danger text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 mb-6 transition"
            >
                <FaArrowLeft /> Back to Namespaces
            </Link>
            
            <div className='rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1'>
                
                {/* 1. Add New Permission (RoleBinding) Form */}
                <div className="flex items-center gap-2 mb-4">
                    <FaPlus className="text-primary" />
                    <h3 className='font-bold text-black dark:text-white'>Grant New Access</h3>
                </div>

                {error && (
                    <div className="mb-4 bg-danger/10 border border-danger text-danger py-3 px-4 rounded-lg text-sm font-bold">
                        Error: {error}
                    </div>
                )}

                <form onSubmit={handleAddBinding} className='flex flex-wrap gap-4 items-end mb-10 bg-gray-2 p-6 rounded-lg dark:bg-meta-4 border border-stroke dark:border-strokedark'>
                    <div className='min-w-[140px]'>
                        <label className='block text-sm font-semibold mb-2'>Target Type</label>
                        <div className="flex bg-white dark:bg-boxdark p-1 rounded-lg border border-stroke dark:border-strokedark">
                            <button 
                                type="button"
                                onClick={() => { setSubjectKind('User'); setSelectedSubject(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-bold transition ${subjectKind === 'User' ? 'bg-primary text-white' : 'text-body hover:bg-gray'}`}
                            >
                                <FaUser /> User
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setSubjectKind('Group'); setSelectedSubject(''); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-bold transition ${subjectKind === 'Group' ? 'bg-primary text-white' : 'text-body hover:bg-gray'}`}
                            >
                                <FaUsers /> Group
                            </button>
                        </div>
                    </div>
                    
                    <div className='flex-1 min-w-[250px]'>
                        <div className="flex justify-between items-center mb-2">
                            <label className='block text-sm font-semibold'>
                                {subjectKind === 'User' ? 'Select Individual User' : 'Select Keycloak Group'}
                            </label>
                            {subjectKind === 'User' && (
                                <select 
                                    className="text-[10px] bg-transparent border-none outline-none text-primary font-bold cursor-pointer"
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                >
                                    <option value="All">Filter Users: All</option>
                                    <option value="cluster-admin">Filter: Admins</option>
                                    <option value="devs">Filter: Devs</option>
                                    <option value="viewers">Filter: Viewers</option>
                                </select>
                            )}
                        </div>
                        
                        <select 
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-white py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
                        >
                            <option value="">{subjectKind === 'User' ? 'Choose a user...' : 'Choose a group...'}</option>
                            {subjectKind === 'User' ? (
                                filteredUsers.map(u => (
                                    <option key={u.id} value={u.email || u.username}>
                                        {u.nama_pegawai} ({u.username})
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="cluster-admin">cluster-admin</option>
                                    <option value="devs">devs</option>
                                    <option value="viewers">viewers</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className='flex-1 min-w-[200px]'>
                        <label className='block text-sm font-semibold mb-2'>Assign Role</label>
                        <select 
                            value={selectedRoleString}
                            onChange={(e) => setSelectedRoleString(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-white py-2.5 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
                        >
                            <option value="">Choose a role...</option>
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
                        disabled={isLoading || !selectedRoleString || !selectedSubject}
                        className='bg-primary text-white py-2.5 px-8 rounded-lg font-bold hover:bg-opacity-90 flex items-center gap-2 transition disabled:opacity-50'
                    >
                        <FaPlus /> Assign
                    </button>
                </form>

                {/* 2. Current Permissions Table */}
                <div className="flex justify-between items-center mb-4 mt-8">
                    <h3 className='font-bold text-black dark:text-white'>Active Namespace Permissions</h3>
                    <div className="text-xs text-gray-5 flex items-center gap-2">
                        <FaFilter />
                        Showing {bindings.length} RoleBindings
                    </div>
                </div>

                <div className='max-w-full overflow-x-auto mb-6'>
                    <table className='w-full table-auto'>
                        <thead>
                            <tr className='bg-gray-2 text-left dark:bg-meta-4 border-b border-stroke dark:border-strokedark'>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Subject (User/Group)</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Role Assigned</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white'>Binding Name</th>
                                <th className='py-4 px-4 font-bold text-black dark:text-white text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bindings.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className='text-center py-10 text-gray-5'>No permissions found in this namespace.</td>
                                </tr>
                            ) : (
                                bindings.map((b, index) => {
                                    const subject = b.subjects?.[0];
                                    const userObj = users.find(u => u.email === subject?.name || u.username === subject?.name);
                                    
                                    return (
                                        <tr key={index} className="hover:bg-gray dark:hover:bg-black/20 transition">
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${subject?.kind === 'Group' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                                                        {subject?.kind === 'Group' ? <FaUsers /> : <FaUser />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-black dark:text-white">
                                                            {userObj ? userObj.nama_pegawai : subject?.name}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-5">{subject?.kind}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black dark:text-white">{b.roleRef.name}</span>
                                                    <span className="text-xs text-gray-5">{b.roleRef.kind}</span>
                                                </div>
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                <code className="text-xs bg-gray-2 dark:bg-meta-4 p-1 rounded">{b.metadata.name}</code>
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark text-center'>
                                                <button 
                                                    onClick={() => handleDelete(b.metadata.name)} 
                                                    className='text-danger hover:scale-110 transition p-2'
                                                >
                                                    <BsTrash3 className="text-lg" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default ManageRbac;
