const fs = require('fs');
const path = require('path');

const targetDirs = [
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/pages',
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/components'
];

const replacements = {
    // Titles and Headers
    "Data Pegawai": "Employee Data",
    "Data Jabatan": "Position Data",
    "Data Kehadiran": "Attendance Data",
    "Data Potongan Gaji": "Salary Deduction Data",
    "Data Potongan": "Deduction Data",
    "Data Gaji Pegawai": "Employee Salary Data",
    "Data Gaji": "Salary Data",
    "Laporan Gaji": "Salary Report",
    "Laporan Absensi": "Attendance Report",
    "Laporan Kehadiran": "Attendance Report",
    "Slip Gaji": "Salary Slip",
    "Ubah Password": "Change Password",
    "Tambah Data Pegawai": "Add Employee Data",
    "Edit Data Pegawai": "Edit Employee Data",
    "Tambah Data Jabatan": "Add Position Data",
    "Edit Data Jabatan": "Edit Position Data",
    "Tambah Data Kehadiran": "Add Attendance Data",
    "Edit Data Kehadiran": "Edit Attendance Data",
    "Tambah Data Potongan": "Add Deduction Data",
    "Edit Data Potongan": "Edit Deduction Data",

    // Buttons
    ">Tambah Data<": ">Add Data<",
    ">Simpan<": ">Save<",
    ">Kembali<": ">Back<",
    ">Cetak Laporan<": ">Print Report<",
    ">Cetak Slip Gaji<": ">Print Salary Slip<",
    ">Tampilkan Data<": ">Show Data<",

    // Table Headers
    ">Aksi<": ">Action<",
    ">No<": ">No.<",
    ">Nama Pegawai<": ">Employee Name<",
    ">Jabatan<": ">Position<",
    ">Jenis Kelamin<": ">Gender<",
    ">Tanggal Masuk<": ">Join Date<",
    ">Status<": ">Status<",
    ">Hak Akses<": ">Access Right<",
    ">Gaji Pokok<": ">Basic Salary<",
    ">Tj. Transport<": ">Transport Allowance<",
    ">Uang Makan<": ">Meal Allowance<",
    ">Total<": ">Total<",
    ">Potongan<": ">Deduction<",
    ">Jumlah Potongan<": ">Deduction Amount<",
    ">Total Gaji<": ">Total Salary<",
    ">Hadir<": ">Present<",
    ">Sakit<": ">Sick<",
    ">Alpha<": ">Absent<",
    ">Bulan<": ">Month<",
    ">Tahun<": ">Year<",
    ">Pilih Bulan<": ">Select Month<",
    ">Pilih Tahun<": ">Select Year<",
    ">NIK<": ">ID Number<",

    // Form placeholders/labels
    'placeholder="Masukkan Nama Pegawai"': 'placeholder="Enter Employee Name"',
    'placeholder="Masukkan NIK"': 'placeholder="Enter ID Number"',
    ">Pilih Jabatan<": ">Select Position<",
    ">Pilih Jenis Kelamin<": ">Select Gender<",
    ">Laki-Laki<": ">Male<",
    ">Perempuan<": ">Female<",
    'placeholder="Masukkan Gaji Pokok"': 'placeholder="Enter Basic Salary"',
    'placeholder="Masukkan Tj. Transport"': 'placeholder="Enter Transport Allowance"',
    'placeholder="Masukkan Uang Makan"': 'placeholder="Enter Meal Allowance"',
    'placeholder="Masukkan Potongan"': 'placeholder="Enter Deduction Amount"',
    ">Admin<": ">Admin<",
    ">Pegawai<": ">Employee<",
    ">Pilih Hak Akses<": ">Select Access Right<",
    ">Password Baru<": ">New Password<",
    ">Ulangi Password Baru<": ">Repeat New Password<",
    'placeholder="Masukkan Password Baru"': 'placeholder="Enter New Password"',
    'placeholder="Ulangi Password Baru"': 'placeholder="Repeat New Password"',

    // Alerts
    "title: 'Berhasil'": "title: 'Success'",
    "title: 'Gagal'": "title: 'Failed'",
    "text: 'Data berhasil ditambahkan'": "text: 'Data added successfully'",
    "text: 'Data berhasil diubah'": "text: 'Data updated successfully'",
    "text: 'Data berhasil dihapus'": "text: 'Data deleted successfully'",
    "text: 'Password berhasil diubah'": "text: 'Password changed successfully'",
    "title: 'Konfirmasi'": "title: 'Confirmation'",
    "text: 'Apakah anda yakin ingin menghapus data ini?'": "text: 'Are you sure you want to delete this data?'",
    "confirmButtonText: 'Ya'": "confirmButtonText: 'Yes'",
    "cancelButtonText: 'Tidak'": "cancelButtonText: 'No'",

    // Print specific
    ">Mengetahui,<": ">Acknowledged by,<",
    "Menunggu data...": "Waiting for data..."
};

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
    
    for (const [key, value] of Object.entries(replacements)) {
        // Simple string replacement using split/join is safer than regex to avoid escaping issues
        content = content.split(key).join(value);
    }
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Translated UI in: ${file}`);
    }
});
console.log("Translation complete!");
