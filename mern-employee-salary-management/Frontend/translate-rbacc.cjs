const fs = require('fs');
const path = require('path');

const targetDirs = [
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/pages',
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/components'
];

const replacements = [
    // Kubernetes RBAC Terminology replacements (from English or Indonesian to New English)
    { from: />Master Data</g, to: ">Cluster Data<" },
    { from: /"Master Data"/g, to: '"Cluster Data"' },
    { from: />Employee Data</g, to: ">Users Data<" },
    { from: /"Employee Data"/g, to: '"Users Data"' },
    { from: />Data Pegawai</g, to: ">Users Data<" },
    { from: /"Data Pegawai"/g, to: '"Users Data"' },
    
    { from: />Position Data</g, to: ">Namespaces Data<" },
    { from: /"Position Data"/g, to: '"Namespaces Data"' },
    { from: />Data Jabatan</g, to: ">Namespaces Data<" },
    { from: /"Data Jabatan"/g, to: '"Namespaces Data"' },

    { from: />Employee Name</g, to: ">User Name<" },
    { from: /"Employee Name"/g, to: '"User Name"' },
    { from: />Nama Pegawai</g, to: ">User Name<" },
    
    { from: />Position</g, to: ">Namespace<" },
    { from: /"Position"/g, to: '"Namespace"' },
    { from: />Jabatan</g, to: ">Namespace<" },

    { from: />Tambah Jabatan</g, to: ">Add Namespace<" },
    { from: />Tambah Pegawai</g, to: ">Add User<" },
    { from: /placeholder='Cari jabatan...'/g, to: "placeholder='Search namespace...'" },
    { from: /placeholder='Cari pegawai...'/g, to: "placeholder='Search user...'" },
    
    { from: /'Data jabatan berhasil dihapus.'/g, to: "'Namespace data successfully deleted.'" },
    { from: /'Data pegawai berhasil dihapus.'/g, to: "'User data successfully deleted.'" },
    { from: /'Apakah Anda yakin ingin Menghapus\?'/g, to: "'Are you sure you want to delete?'" },
    { from: /'Apakah Anda yakin ingin menghapus data ini\?'/g, to: "'Are you sure you want to delete this data?'" },

    { from: />Bulan\/Tahun</g, to: ">Month/Year<" },
    { from: />Gaji Pokok</g, to: ">Basic Salary<" },
    { from: />Tunjangan Transportasi</g, to: ">Transport Allowance<" },
    { from: />Tunjangan Transport</g, to: ">Transport Allowance<" },
    { from: />Uang Makan</g, to: ">Meal Allowance<" },
    { from: />Potongan</g, to: ">Deduction<" },
    { from: />Total Gaji</g, to: ">Total Salary<" },
    { from: />Cetak Slip</g, to: ">Print Slip<" },
    
    { from: /Menampilkan \{/g, to: "Showing {" },
    { from: /\} dari \{/g, to: "} of {" },
    { from: /"Terjadi Kesalahan"/g, to: '"An Error Occurred"' },
    { from: /"Terjadi kesalahan saat memuat data."/g, to: '"An error occurred while loading data."' },
    { from: /"Data tidak ditemukan"/g, to: '"Data not found"' },
    { from: /"Maaf, data yang anda cari tidak ditemukan"/g, to: '"Sorry, the data you are looking for was not found"' },
    { from: />Aksi</g, to: ">Action<" },
    
    // Some missed button translations in indonesian
    { from: />Tambah Data</g, to: ">Add Data<" },
    { from: />Ubah Password</g, to: ">Change Password<" },
    { from: />Simpan</g, to: ">Save<" },
    { from: />Kembali</g, to: ">Back<" }
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
    
    replacements.forEach(({from, to}) => {
        content = content.replace(from, to);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated KubeRBAC terminology in: ${file}`);
    }
});
console.log("Translation and terminology update complete!");
