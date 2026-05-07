import { useState, useEffect } from 'react';
import Layout from '../../../../layout';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Breadcrumb } from '../../../../components';
import { BiSearch } from 'react-icons/bi';
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from 'react-icons/md';
import { getMe } from '../../../../config/redux/action';
import axios from 'axios';

const ITEMS_PER_PAGE = 10;

const statusColor = (phase) => {
    switch (phase) {
        case 'Running':  return 'bg-success/10 text-success';
        case 'Pending':  return 'bg-warning/10 text-warning';
        case 'Failed':   return 'bg-danger/10 text-danger';
        case 'Succeeded': return 'bg-primary/10 text-primary';
        default:         return 'bg-gray-100 text-gray-500';
    }
};

const NamespacePods = () => {
    const { name } = useParams();
    const [pods, setPods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) navigate('/login');
        if (user && user.hak_akses !== 'admin') navigate('/dashboard');
    }, [isError, user, navigate]);

    useEffect(() => {
        const fetchPods = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/namespaces/${name}/pods`);
                setPods(res.data);
            } catch (e) {
                setError(e.response?.data?.msg || 'Failed to fetch pods');
            } finally {
                setLoading(false);
            }
        };
        fetchPods();
    }, [name]);

    const filtered = pods.filter(p =>
        p.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = filtered.slice(startIndex, endIndex);

    return (
        <Layout>
            <Breadcrumb pageName={`Pods — ${name}`} />

            <Link
                to="/namespaces-data"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
            >
                ← Back to Namespaces
            </Link>

            <div className='rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 mt-4'>
                <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                        <input
                            type='text'
                            placeholder='Search pod name...'
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className='rounded-lg border-[1.5px] border-stroke bg-transparent py-2 pl-10 pr-4 font-medium outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary'
                        />
                        <span className='absolute left-2 top-2.5 text-xl'><BiSearch /></span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {filtered.length} pod{filtered.length !== 1 ? 's' : ''} in <strong>{name}</strong>
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-danger">{error}</div>
                ) : paginated.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No pods found in namespace <strong>{name}</strong>
                    </div>
                ) : (
                    <div className='max-w-full overflow-x-auto py-4'>
                        <table className='w-full table-auto'>
                            <thead>
                                <tr className='bg-gray-2 text-left dark:bg-meta-4'>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Pod Name</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Status</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Ready</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Restarts</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Node</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Pod IP</th>
                                    <th className='py-4 px-4 font-medium text-black dark:text-white'>Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((pod) => (
                                    <tr key={pod.name}>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className='text-black dark:text-white font-mono text-sm'>{pod.name}</p>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(pod.phase)}`}>
                                                {pod.phase}
                                            </span>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className='text-black dark:text-white'>{pod.ready}</p>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className={`font-semibold ${pod.restarts > 0 ? 'text-warning' : 'text-black dark:text-white'}`}>
                                                {pod.restarts}
                                            </p>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className='text-black dark:text-white text-sm'>{pod.node}</p>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className='text-black dark:text-white font-mono text-sm'>{pod.ip}</p>
                                        </td>
                                        <td className='border-b border-[#eee] py-4 px-4 dark:border-strokedark'>
                                            <p className='text-black dark:text-white'>{pod.age}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {startIndex + 1}–{Math.min(endIndex, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="py-2 px-4 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                            >
                                <MdKeyboardDoubleArrowLeft />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="py-2 px-4 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                            >
                                <MdKeyboardDoubleArrowRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default NamespacePods;
