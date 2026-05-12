import React from "react";
import LogoSipeka from "../../assets/images/logo/logo-sipeka.png";
import LoginImg from "../../assets/images/LoginImg/login.svg";
import { Footer, LoginInput, Navbar } from "../../components";

function Login() {
  return (
    <div className="min-h-screen rounded-sm border border-stroke pt-10 shadow-default dark:border-strokedark dark:bg-boxdark">

      <div className="flex min-h-screen flex-wrap items-center">
        <div className="hidden w-full xl:block xl:w-1/2">
          <div className="px-12 py-16 text-center">
            <div className="mb-8 inline-block">
              <img
                src={LogoSipeka}
                alt="KubeRBAC Dashboard"
                title="KubeRBAC Dashboard"
                className="max-w-[80%] h-auto"
                style={{ maxHeight: "400px" }}
              />
            </div>
            <p className="text-xl text-gray-800 dark:text-white font-bold leading-relaxed">
              Secure RBAC access for your Kubernetes cluster
              <br />
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300 mt-2 block">
                Manage roles and permissions in one place
              </span>
            </p>
          </div>
        </div>

        <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2">
          <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
            <LoginInput />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
