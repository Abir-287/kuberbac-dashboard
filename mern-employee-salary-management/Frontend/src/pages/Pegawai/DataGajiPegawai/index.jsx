import { useState, useEffect } from "react";
import Layout from "../../../layout";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "../../../components";
import Swal from "sweetalert2";
import { getMe, viewGajiSinglePegawaiByMonth, viewGajiSinglePegawaiByName, viewGajiSinglePegawaiByYear } from "../../../config/redux/action";
import axios from "axios";
import { TfiPrinter } from "react-icons/tfi";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";

const ITEMS_PER_PAGE = 4;

const DataGajiPegawai = () => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isError, user } = useSelector((state) => state.auth);

  const username = user?.username || "";

  const totalPages = Math.ceil(userPermissions.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const paginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`border border-gray-2 px-4 py-2 font-semibold text-black dark:border-strokedark dark:text-white ${currentPage === page
            ? "bg-primary text-white hover:bg-primary dark:bg-primary dark:hover:bg-primary"
            : "hover:bg-gray-2 dark:hover:bg-stroke"
            } rounded-lg`}
        >
          {page}
        </button>
      );
    }

    return items;
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(`/api/rbac/user-permissions/${username}`);
        setUserPermissions(response.data);
      } catch (error) {
        console.log("Error fetching permissions:", error);
      }
    };

    if (username) {
      fetchPermissions();
    }
  }, [username]);

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      navigate("/login");
    }
    if (user && user.hak_akses !== "pegawai") {
      navigate("/dashboard");
    }
  }, [isError, user, navigate]);


  return (
    <Layout>
      <Breadcrumb pageName="Permissions" />

      <div className="mt-6 rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto py-4">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  No
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Namespace
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Role Name
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Binding Name
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Kind
                </th>
                <th className="px-4 py-4 font-medium text-black dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {userPermissions.length > 0 ? (
                userPermissions
                  .slice(startIndex, endIndex)
                  .map((perm, index) => {
                    return (
                      <tr key={index}>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark text-center">
                          <p className="text-black dark:text-white">
                            {startIndex + index + 1}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white font-bold">
                            {perm.namespace || "Cluster-wide"}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {perm.roleName}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white text-sm">
                            {perm.bindingName}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                          <p className="text-black dark:text-white">
                            {perm.kind}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                           <span className="inline-flex items-center rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                              Active
                            </span>
                        </td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                   <td colSpan="6" className="py-10 text-center text-gray-500">
                      No specific RBAC bindings found for your account.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between md:flex-row md:justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-5 dark:text-gray-4 py-4 text-sm">
              Showing {userPermissions.length > 0 ? startIndex + 1 : 0}-
              {Math.min(endIndex, userPermissions.length)} of{" "}
              {userPermissions.length} Permissions
            </span>
          </div>
          <div className="flex space-x-2 py-4">
            <button
              disabled={currentPage === 1}
              onClick={goToPrevPage}
              className="rounded-lg border border-primary px-6 py-2 font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50 dark:border-primary dark:text-white dark:hover:bg-primary dark:hover:text-white"
            >
              <MdKeyboardDoubleArrowLeft />
            </button>
            {paginationItems()}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={goToNextPage}
              className="rounded-lg border border-primary px-6 py-2 font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-50 dark:border-primary dark:text-white dark:hover:bg-primary dark:hover:text-white"
            >
              <MdKeyboardDoubleArrowRight />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DataGajiPegawai;
