const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Use Google/Cloudflare DNS

dns.resolveSrv('_mongodb._tcp.cluster0.vqufiar.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('Failed to resolve SRV:', err.message);
        return;
    }
    
    dns.resolveTxt('cluster0.vqufiar.mongodb.net', (errTxt, txtRecords) => {
        const hosts = addresses.map(a => `${a.name}:${a.port}`).join(',');
        let authSource = 'admin';
        let replicaSet = '';
        
        if (!errTxt && txtRecords) {
            const txt = txtRecords.flat().join('');
            if (txt.includes('authSource=')) {
                const match = txt.match(/authSource=([^&]+)/);
                if (match) authSource = match[1];
            }
            if (txt.includes('replicaSet=')) {
                const match = txt.match(/replicaSet=([^&]+)/);
                if (match) replicaSet = match[1];
            }
        }
        
        console.log(`\nDirect Connection String:`);
        console.log(`mongodb://farhansk2800_db_user:0AkQg5XccrlWJcKi@${hosts}/laundry?ssl=true&replicaSet=atlas-13d80h-shard-0&authSource=admin&retryWrites=true&w=majority\n`);
        // I will try to print the dynamic replicaSet name if I can, but atlas format is usually: atlas-<something>-shard-0
    });
});
