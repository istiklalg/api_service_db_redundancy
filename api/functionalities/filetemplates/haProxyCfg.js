/**
 * @author istiklal
 */

exports.generateHaProxyCfg = (allNodesList) => {
    /**
     * Function to generate content of haproxy.cfg file which will be in place /etc/haproxy/ directory;
     */
    let part1 = `# This file is written by atibaApiService
global
	log /dev/log	local0
	log /dev/log	local1 notice
	chroot /var/lib/haproxy
	stats socket 	/run/haproxy/admin.sock mode 660 level admin expose-fd listeners
	stats timeout 	30s
	user haproxy
	group haproxy
	daemon

        # Default SSL material locations
        ca-base /etc/ssl/certs
        crt-base /etc/ssl/private

        # Default ciphers to use on SSL-enabled listening sockets.
        # For more information, see ciphers(1SSL). This list is from:
        #  https://hynek.me/articles/hardening-your-web-servers-ssl-ciphers/
        # An alternative list with additional directives can be obtained from
        #  https://mozilla.github.io/server-side-tls/ssl-config-generator/?server=haproxy
        ssl-default-bind-ciphers ECDH+AESGCM:DH+AESGCM:ECDH+AES256:DH+AES256:ECDH+AES128:DH+AES:RSA+AESGCM:RSA+AES:!aNULL:!MD5:!DSS
        ssl-default-bind-options no-sslv3

defaults
	log	global
	mode 	tcp
	option	httplog
	option	dontlognull
	retries	3
	timeout client	30m
	timeout connect	4s
	timeout server	30m
	timeout check	5s
	errorfile 400	/etc/haproxy/errors/400.http
	errorfile 403	/etc/haproxy/errors/403.http
	errorfile 408	/etc/haproxy/errors/408.http
	errorfile 500	/etc/haproxy/errors/500.http
	errorfile 502	/etc/haproxy/errors/502.http
	errorfile 503	/etc/haproxy/errors/503.http
	errorfile 504	/etc/haproxy/errors/504.http

listen Elasticsearch-TCP-19200
	bind	*:19200
	mode 	tcp
	option	tcpka
	option	tcplog
	option	redispatch
	option	httpchk	GET /
	timeout	server 	5000
	balance	roundrobin
	
	# add new line for new node, and this change will be written for all nodes;
`

    let part2= "";
    allNodesList.forEach(element => {
        part2 += "    server node"+(element.split('.')).join('')+"    "+element+":9200 check\n";
    });
	// for(let i=0;i<allNodesList.length;i++) {
    //     part2 += "    server node"+(allNodesList[i].split('.')).join('')+"    "+allNodesList[i]+":9200 check\n";
    // }

/*
    server node1	{% NODE1_IP %}:9200 check
	server node2	{% NODE2_IP %}:9200 check
	server node3	{% NODE3_IP %}:9200 check

*/

	let part3 = `
listen PGSQL-TCP-15432
	bind 	*:15432
	option	httpchk
	http-check	expect status 200
	default-server	inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
	
	#  add new line for new node, and this change will be written for all nodes;
`
    let part4 = "";
    for(let i=0;i<3;i++){
        part4 += "	server node"+(allNodesList[i].split('.')).join('')+" 	"+allNodesList[i]+":5432 check port 23267\n"
    }

/*
	server node1 	{% NODE1_IP %}:5432 check port 23267
	server node2 	{% NODE2_IP %}:5432 check port 23267
	server node3 	{% NODE3_IP %}:5432 check port 23267
*/
    let part5 = `
listen status
	bind	*:8088
	stats	enable
	stats	uri /

listen stats
	mode	http
	bind	*:8089
	stats	enable
	stats	uri /
`
    let content = part1+part2+part3+part4+part5;
    return content;
}