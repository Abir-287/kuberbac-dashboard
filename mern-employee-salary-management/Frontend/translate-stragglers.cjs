const fs = require('fs');
const path = require('path');

const targetDirs = [
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/pages',
    '/home/abir/dashboard-rbac/mern-employee-salary-management/Frontend/src/components'
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
    
    // Replace standalone occurrences that missed the regex tags
    content = content.replace(/Position Data/g, "Namespaces Data");
    content = content.replace(/Employee Data/g, "Users Data");
    content = content.replace(/Employee Name/g, "User Name");
    content = content.replace(/Position/g, "Namespace");
    
    // Also "Master Data" just in case
    content = content.replace(/Master Data/g, "Cluster Data");
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated stragglers in: ${file}`);
    }
});
console.log("Straggler terminology update complete!");
