import imagesToPdf from 'images-to-pdf';
import path from 'path';

const imagePath = '/home/abir/.gemini/antigravity/brain/598b61d5-6e5d-4892-a580-22522642be72/oidc_auth_complete_detailed_french_1778891100784.png';
const outputPdf = '/home/abir/dashboard-rbac/oidc_auth_diagram.pdf';

imagesToPdf([imagePath], outputPdf);
console.log('PDF created at ' + outputPdf);
