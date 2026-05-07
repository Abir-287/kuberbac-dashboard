import React, { useState, useEffect } from 'react';
import Layout from '../../../../layout';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Breadcrumb } from '../../../../components';
import Swal from 'sweetalert2';
import { BsTrash3 } from 'react-icons/bs';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';

const ManageRbac = () => {
    const { id: namespace } = useParams();
    const navigate = useNavigate();
    const [bindings, setBindings] = useState([]);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    
    // Binding form state
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRoleString, setSelectedRoleString] = useState('');
    
    // Custom Role form state
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleResources, setNewRoleResources] = useState('');
    const [newRoleVerbs, setNewRoleVerbs] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = 'http://localhost:5000';

    const fetchData = async () => {
        try {
            const [bindingsRes, usersRes, rolesRes] = await Promise.all([
                axios.get(`${API_URL}/rbac/bindings/${namespace}`, { withCredentials: true }),
                axios.get(`${API_URL}/data_pegawai`, { withCredentials: true }),
                axios.get(`${API_URL}/rbac/roles/${namespace}`, { withCredentials: true })
            ]);
            setBindings(bindingsRes.data);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error("Error fetching RBAC data:", error);
            Swal.fire('Error', 'Failed to fetch RBAC data', 'error');
        }
    };

    useEffect(() => {
        fetchData();
    }, [namespace]);

    const handleAddBinding = async (e) => {
        e.preventDefault();
        if (!selectedUser || !selectedRoleString) {
            return Swal.fire('Error', 'Please select both a user and a role', 'error');
        }

        const roleData = JSON.parse(selectedRoleString);
        
        // Generate binding name using full name
        const userObj = users.find(u => (u.email || u.username) === selectedUser);
        let bindingName = "";
        if (userObj && userObj.nama_pegawai) {
            const safeName = userObj.nama_pegawai.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            bindingName = `${safeName}-${roleData.name}-binding`;
        }

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/rbac/bindings/${namespace}`, {
                username: selectedUser,
                roleName: roleData.name,
                roleKind: roleData.kind,
                bindingName: bindingName
            }, { withCredentials: true });
            
            Swal.fire('Success', 'Role assigned successfully', 'success');
            setSelectedUser('');
            setSelectedRoleString('');
            fetchData();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.msg || 'Failed to assign role', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleName || !newRoleResources || !newRoleVerbs) {
            return Swal.fire('Error', 'Please fill all fields to create a custom role', 'error');
        }

        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/rbac/custom-roles/${namespace}`, {
                roleName: newRoleName,
                resources: newRoleResources,
                verbs: newRoleVerbs
            }, { withCredentials: true });
            
            Swal.fire('Success', 'Custom Role created successfully', 'success');
            setNewRoleName('');
            setNewRoleResources('');
            setNewRoleVerbs('');
            fetchData(); // Refresh roles list to include the new one
        } catch (error) {
            Swal.fire('Error', error.response?.data?.msg || 'Failed to create role', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBinding = async (name) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Remove this permission?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/rbac/bindings/${namespace}/${name}`, { withCredentials: true });
                Swal.fire('Deleted!', 'Permission removed.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete binding', 'error');
            }
        }
    };

    // Define the whitelist of "meaningful" roles
    const usefulRolesWhitelist = [
        'developer-access', 
        'viewer-limited', 
        'namespace-admin', 
        'view', 
        'edit', 
        'admin', 
        'cluster-admin'
    ];

    // Filter roles: strictly only show whitelisted ones
    const filteredRoles = roles
        .filter(r => usefulRolesWhitelist.includes(r.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Layout>
            <Breadcrumb pageName={`Manage RBAC: ${namespace}`} />
            
            <Link 
                to="/namespaces-data"
                className="inline-flex items-center gap-2 bg-danger text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 mb-6 transition"
            >
                <FaArrowLeft /> Back to Namespaces
            </Link>
            
            <div className='rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1'>
                
                {/* 1. Add New Permission (RoleBinding) Form */}
                <h3 className='font-medium text-black dark:text-white mb-4'>Assign Role to User</h3>
                <form onSubmit={handleAddBinding} className='flex flex-wrap gap-4 items-end mb-8 bg-gray-2 p-4 rounded-lg dark:bg-meta-4'>
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block text-sm font-medium mb-1'>User</label>
                        <select 
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary'
                        >
                            <option value="">Select User</option>
                            {users.map(u => (
                                <option key={u.id} value={u.email || u.username}>
                                    {u.nama_pegawai} ({u.email || u.username})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block text-sm font-medium mb-1'>Role</label>
                        <select 
                            value={selectedRoleString}
                            onChange={(e) => setSelectedRoleString(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary'
                        >
                            <option value="">Select Role</option>
                            {filteredRoles.map(r => {
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
                        disabled={isLoading}
                        className='bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 flex items-center gap-2'
                    >
                        <FaPlus /> Assign
                    </button>
                </form>

                {/* 2. Create Custom Role Form */}
                <h3 className='font-medium text-black dark:text-white mb-4'>Create Custom Role (Namespace Scope)</h3>
                <form onSubmit={handleCreateRole} className='flex flex-wrap gap-4 items-end mb-8 border border-stroke p-4 rounded-lg dark:border-strokedark'>
                    <div className='flex-1 min-w-[150px]'>
                        <label className='block text-sm font-medium mb-1'>Role Name</label>
                        <input 
                            type="text"
                            placeholder="e.g. log-viewer"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary'
                        />
                    </div>
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block text-sm font-medium mb-1'>Resources (comma separated)</label>
                        <input 
                            type="text"
                            placeholder="e.g. pods, deployments"
                            value={newRoleResources}
                            onChange={(e) => setNewRoleResources(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary'
                        />
                    </div>
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block text-sm font-medium mb-1'>Verbs (comma separated)</label>
                        <input 
                            type="text"
                            placeholder="e.g. get, list, watch"
                            value={newRoleVerbs}
                            onChange={(e) => setNewRoleVerbs(e.target.value)}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary'
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className='bg-success text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 flex items-center gap-2'
                    >
                        <FaPlus /> Create Role
                    </button>
                </form>

                {/* 3. Current Permissions Table */}
                <h3 className='font-medium text-black dark:text-white mb-4 mt-8'>Current Permissions (RoleBindings)</h3>
                <div className='max-w-full overflow-x-auto'>
                    <table className='w-full table-auto'>
                        <thead>
                            <tr className='bg-gray-2 text-left dark:bg-meta-4'>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Binding Name</th>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Full Name</th>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Group</th>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Email</th>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Role Reference</th>
                                <th className='py-4 px-4 font-medium text-black dark:text-white'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bindings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className='text-center py-4'>No RoleBindings found in this namespace.</td>
                                </tr>
                            ) : (
                                bindings.map((b) => {
                                    // Cross-reference K8s subjects with our Database users
                                    const subjectName = b.subjects?.[0]?.name || '';
                                    const userObj = users.find(u => u.email === subjectName || u.username === subjectName);
                                    
                                    const fullName = userObj ? userObj.nama_pegawai : (b.subjects?.[0]?.kind === 'Group' ? 'Group Assignment' : 'Unknown');
                                    const group = userObj ? (userObj.groups || 'None') : (b.subjects?.[0]?.kind === 'Group' ? subjectName : 'None');
                                    const email = userObj ? userObj.email : (b.subjects?.[0]?.kind === 'Group' ? '-' : subjectName);

                                    return (
                                        <tr key={b.metadata.name}>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                {b.metadata.name}
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                {fullName}
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                {group}
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                {email}
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                <span className={b.roleRef.kind === 'ClusterRole' ? 'text-primary' : 'text-success'}>
                                                    {b.roleRef.name} ({b.roleRef.kind})
                                                </span>
                                            </td>
                                            <td className='border-b border-[#eee] py-5 px-4 dark:border-strokedark'>
                                                <button onClick={() => handleDeleteBinding(b.metadata.name)} className='text-danger'>
                                                    <BsTrash3 />
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
