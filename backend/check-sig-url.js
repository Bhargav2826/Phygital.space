const crypto = require('crypto');

const str = 'folder=phygital/qrcodes&timestamp=1772446487&unique_filename=1&use_filename=1';
const secretFromURL = 'UJXPfrinWqdaOeslt6_d1VODCdE';

const signature = crypto.createHash('sha1').update(str + secretFromURL).digest('hex');
console.log('Signature with UJX...: ', signature);

const actualErrorSig = '3f739d3db12c72fdbcb565dee90fe54f3be49186';
console.log('Matches error?', signature === actualErrorSig);
