const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Use Google/Cloudflare DNS

dns.resolveTxt('cluster0.vqufiar.mongodb.net', (errTxt, txtRecords) => {
    let replicaSet = 'atlas-qsxjy2s-shard-0';
    if (!errTxt && txtRecords) {
        const txt = txtRecords.flat().join('');
        if (txt.includes('replicaSet=')) {
            const match = txt.match(/replicaSet=([^&]+)/);
            if (match) replicaSet = match[1];
        }
    }
    
    console.log(`\nReplicaSet: ${replicaSet}\n`);
});
