import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const ChartOne = () => {
  const [timePeriod, setTimePeriod] = useState('Month');

  // Dummy data generators for different periods
  const getData = (period) => {
    switch (period) {
      case 'Day':
        return {
          categories: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
          created: [2, 5, 8, 12, 7, 4],
          deleted: [0, 1, 3, 2, 1, 0]
        };
      case 'Week':
        return {
          categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          created: [15, 22, 18, 30, 25, 10, 5],
          deleted: [2, 5, 4, 8, 3, 1, 0]
        };
      case 'Month':
      default:
        return {
          categories: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          created: [4, 7, 3, 5, 8, 4, 12, 6, 9, 3, 7, 5],
          deleted: [1, 2, 0, 3, 1, 4, 2, 1, 5, 2, 0, 1]
        };
    }
  };

  const currentData = getData(timePeriod);

  const series = [
    {
      name: 'Permissions Created',
      data: currentData.created,
    },
    {
      name: 'Permissions Deleted',
      data: currentData.deleted,
    },
  ];

  const options = {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#3C50E0', '#80CAEE'],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      height: 335,
      type: 'area',
      dropShadow: {
        enabled: true,
        color: '#623CEA14',
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: 'smooth',
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: '#fff',
      strokeColors: ['#3056D3', '#80CAEE'],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: 'category',
      categories: currentData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        style: {
          fontSize: '0px',
        },
      },
      min: 0,
    },
  };

  return (
    <div className='col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8'>
      <div className='flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap'>
        <div className='flex w-full flex-wrap gap-3 sm:gap-5'>
          <div className='flex min-w-47.5'>
            <span className='mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary'>
              <span className='block h-2.5 w-full max-w-2.5 rounded-full bg-primary'></span>
            </span>
            <div className='w-full'>
              <p className='font-semibold text-primary'>Permissions Created</p>
              <p className='text-sm font-medium'>Activity Log</p>
            </div>
          </div>
          <div className='flex min-w-47.5'>
            <span className='mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary'>
              <span className='block h-2.5 w-full max-w-2.5 rounded-full bg-secondary'></span>
            </span>
            <div className='w-full'>
              <p className='font-semibold text-secondary'>Permissions Deleted</p>
              <p className='text-sm font-medium'>Activity Log</p>
            </div>
          </div>
        </div>
        <div className='flex w-full max-w-45 justify-end'>
          <div className='inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4'>
            {['Day', 'Week', 'Month'].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`rounded py-1 px-3 text-xs font-medium text-black shadow-card hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark ${
                  timePeriod === period ? 'bg-white dark:bg-boxdark' : ''
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div id='chartOne' className='-ml-5'>
          <ReactApexChart
            options={options}
            series={series}
            type='area'
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
