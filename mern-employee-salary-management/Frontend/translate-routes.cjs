const fs = require('fs');
const path = require('path');

const targetDirs = [
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src'
];

const routeReplacements = [
    // Paths
    { from: /\/data-pegawai/g, to: "/users-data" },
    { from: /\/data-jabatan/g, to: "/namespaces-data" },
    { from: /\/data-kehadiran/g, to: "/attendance-data" },
    { from: /\/data-potongan/g, to: "/deduction-data" },
    { from: /\/data-gaji-pegawai/g, to: "/employee-salary-data" }, // Must precede /data-gaji
    { from: /\/data-gaji/g, to: "/salary-data" },
    { from: /\/laporan\/gaji/g, to: "/report/salary" },
    { from: /\/laporan\/absensi/g, to: "/report/attendance" },
    { from: /\/laporan\/slip-gaji/g, to: "/report/salary-slip" },
    { from: /\/ubah-password-pegawai/g, to: "/change-password-employee" }, // Must precede /ubah-password
    { from: /\/ubah-password/g, to: "/change-password" },
    { from: /\/pengaturan/g, to: "/settings" },
    
    // Sidebar visible texts that might not have been caught
    { from: />Pengaturan</g, to: ">Settings<" },
    { from: />Laporan</g, to: ">Report<" },
    { from: />Transaksi</g, to: ">Transaction<" }
];

const walkSync = function(dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            if(file.endsWith('.jsx')) {
                filelist.push(path.join(dir, file));
            }
        }
    });
    return filelist;
};

let allFiles = [];
targetDirs.forEach(dir => {
    allFiles = allFiles.concat(walkSync(dir));
});

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    routeReplacements.forEach(({from, to}) => {
        content = content.replace(from, to);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated routing in: ${file}`);
    }
});
console.log("Routing translation complete!");
