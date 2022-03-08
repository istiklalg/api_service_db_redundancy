/**
 * @author istiklal
 * 
 * it wont be used no more.......
 */

expoorts.generateRepmgrConf = (pgNodeID, nodeIP) => {
    /**
     * Function to postgresql.conf files for nodes;
     */
    let part1 = `
node_id=${pgNodeID}
node_name=node${pgNodeID}
conninfo='host=${ nodeIP } user=repmgr dbname=repmgr connect_timeout=2'
data_directory='/var/lib/postgresql/10/main/'
failover=automatic
promote_command='/usr/bin/repmgr standby promote -f /etc/repmgr.conf --log-to-file'
follow_command='/usr/bin/repmgr standby follow -f /etc/repmgr.conf --log-to-file --upstream-node-id=%n'
`
    return part1;
}