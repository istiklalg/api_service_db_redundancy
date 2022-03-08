/**
 * @author istiklal
 */

exports.generatePgHbaConf = (ipForBucardo, maskForBucardo) => {
    /**
     * Function to generate pg_hba.conf file content;
     * 
     * local   all             bucardo                                 trust
     * host    all             bucardo         127.0.0.1/32            trust
     * host    all             bucardo         192.168.255.0/24        trust
     */
    let part1 = `
local   all             bucardo                                 trust
host    all             bucardo         127.0.0.1/32            trust
host    all             bucardo         ${ipForBucardo}/${maskForBucardo}        trust
`
    return part1;
}

exports.generatePgHbaConf = (ipListForBucardo) => {
    /**
     * Function to generate pg_hba.conf file content;
     * 
     * local   all             bucardo                                 trust
     * host    all             bucardo         127.0.0.1/32            trust
     * host    all             bucardo         {% NODE_IP %}/32        trust
     * host    all             bucardo         {% NODE_IP %}/32        trust
     */
    let part1 = `
local   all             bucardo                                 trust
host    all             bucardo         127.0.0.1/32            trust
`
    let part2 = ""
    ipListForBucardo.forEach(element => {
        part2 += `host    all             bucardo         ${element}/32        trust
`
    });

    return part1 + part2;
}