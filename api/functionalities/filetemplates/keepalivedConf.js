/**
 * @author istiklal
 */

exports.generateKeepAlivedConf = (isMaster, priorityNumber, masterIP, nodeListWithoutMaster, newNodesList) => {
    /**
     * Function to generate keepalived.conf file content for nodes
     */
    let part1 = `! This file is written by atibaApiService
! /etc/keepalived/keepalived.conf file
! Configuration File for keepalived

global_defs {
    script_user root root
    enable_script_security
}
vrrp_script chk_haproxy { 
    script "/usr/bin/killall -0 haproxy" 
    interval 2 
    weight 2 
}
vrrp_instance ATIBA {
    state ${isMaster?`MASTER`:`BACKUP`}
    priority ${priorityNumber}
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1234
    }
    virtual_ipaddress {
        {% VRRP_IP %}
    }
    track_script {
        chk_haproxy
    }
}

virtual_server {% VRRP_IP %} 514 {
    delay_loop 1
    lb_algo rr
    lb_kind NAT
    ops
    protocol UDP
    persistence_timeout 30
    `
    let part2 = `
    real_server ${masterIP} 11514 {
            weight 1
            MISC_CHECK {
            misc_path "/usr/local/bin/miscchk ${masterIP}"
            misc_timeout 3
        }
    }
    `
    nodeListWithoutMaster.forEach(element => {
        part2 += `
    real_server ${element} 11514 {
            weight 1
            MISC_CHECK {
            misc_path "/usr/local/bin/miscchk ${element}"
            misc_timeout 3
        }
    }
    `
    });
    newNodesList.forEach(element => {
        part2 += `
    real_server ${element} 11514 {
            weight 1
            MISC_CHECK {
            misc_path "/usr/local/bin/miscchk ${element}"
            misc_timeout 3
        }
    }
    `
    });
    context = part1 + part2 + `
}
    `;
    return context;
}