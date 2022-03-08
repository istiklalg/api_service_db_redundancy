/**
 * @author istiklal
 */

const env = require("../../configuration");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const Logger = require('../logger');
const logger = new Logger("cluster_controller");
const { generateKeepAlivedConf } = require("./filetemplates/keepalivedConf");
const { generateElasticsearchYML } = require("./filetemplates/elasticsearchYML");
const { generatePgHbaConf } = require("./filetemplates/pgHbaConf");
const { generateHaProxyCfg } = require("./filetemplates/haProxyCfg");
const { json } = require("body-parser");


exports.linuxHaOperations = (jsonObject) => {
    let operationStatus = true;
    logger.info(`Linux HA operations started with parameter ${jsonObject.nodeList?jsonObject.nodeList:"NOTHING"}`, "linuxHaOperations", 21);
    if(env.IN_PRODUCTION){
        let fileName = "/etc/keepalived/keepalived.conf";
        let content = generateKeepAlivedConf(jsonObject.isMaster, jsonObject.priorityNumber, jsonObject.masterIP, jsonObject.nodeListWithoutMaster, jsonObject.newNodesList);
        fs.writeFile(fileName, content, (err) => {if(err) logger.error(`ERROR IS : ${err}`, "linuxHaOperations")});
        logger.info(`keepalived.conf file saved`, "linuxHaOperations", 24);
        dir = exec(`chmod 644 ${fileName}`, function(err, stdout, stderr) {
            if (err) {
                logger.error(`An error occurred trying to run command "chmod 644 ${fileName}". ERROR IS : ${err}`, "linuxHaOperations", 29);
                operationStatus = false;
            }
            logger.info(`"chmod 644 ${fileName}" command returns ${stdout}`, "linuxHaOperations", 32);
        });
        // dir.on('exit', function (code) {
        //     // this callback function is written to handle exit code on errors
        // });
        runSystemCtl(jsonObject, "keepalived");      
    }else{
        logger.warning(`Not production environment`, "linuxHaOperations", 39);
        let content = generateKeepAlivedConf(jsonObject.isMaster, jsonObject.priorityNumber, jsonObject.masterIP, jsonObject.nodeListWithoutMaster, jsonObject.newNodesList);
        let fileName = path.join(__dirname, "../static/keepalived.txt");
        fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "linuxHaOperations", 42); operationStatus=false; });
        if(jsonObject.myIP in jsonObject.newNodesList) logger.debug("HEEEY I'm a new node for cluster.........", "linuxHaOperations", 43)
    }

    if(operationStatus){
        logger.info(`linux ha operations finished. STATUS : ${operationStatus}`, "linuxHaOperations", 47);
    }else{
        logger.error(`linux ha operations finished. STATUS : ${operationStatus}`, "linuxHaOperations", 49);
    }
    return operationStatus;
}

exports.esClusteringOperations = (jsonObject) => {
    let operationStatus = true;
    logger.info(`Elasticsearch Clustering operations started`, "esClusteringOperations", 56);
    if(env.IN_PRODUCTION){
        // operations starts with 
        // (data node'larda (node2 ve node3) /var/lib/elasticsearch dizinin altına nodes dizini silinmeli!!!)
        // for new nodes
        // then generate elasticsearch.yml file on location /etc/elasticsearch/
        // and then run command "systemctl restart eleasticsearch" on new nodes, "systemctl reload eleasticsearch" on existing nodes
        if(!jsonObject.isMaster) {
            // in all nodes except master node, we wil remove "nodes" directory placed in "/var/lib/elasticsearch" path !!
            fs.rm("/var/lib/elasticsearch/nodes", { recursive: true, force: true });
        }
        let fileName = "/etc/elasticsearch/elasticsearch.yml";
        let nodesList = jsonObject.allNodesList.toString().split(",");
        let content = generateElasticsearchYML(jsonObject.isMaster, jsonObject.nodeID, jsonObject.roles, nodesList);
        fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "esClusteringOperations", 70); operationStatus=false; });
        runSystemCtl(jsonObject, "elasticsearch");
    }else{
        logger.warning(`Not production environment`, "esClusteringOperations", 73);
        let fileName = path.join(__dirname, "../static/elasticsearch.txt");
        let nodesList = jsonObject.allNodesList.toString().split(",");
        let content = generateElasticsearchYML(jsonObject.isMaster, jsonObject.nodeID, jsonObject.roles, nodesList);
        fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "esClusteringOperations", 77); operationStatus=false; });
        runSystemCtl(jsonObject, "python");
    }

    if(operationStatus){
        logger.info(`Elasticsearch Clustering operations finished. STATUS : ${operationStatus}`, "esClusteringOperations", 81);
    }else{
        logger.error(`Elasticsearch Clustering operations finished. STATUS : ${operationStatus}`, "esClusteringOperations", 84);
    }
    return operationStatus;
}

exports.pgClusteringOperations = (jsonObject) => {
    let operationStatus=true;
    if(jsonObject.isPostgreActive && jsonObject.nodeListWithoutMaster.length < 2){
        if(env.IN_PRODUCTION){
            // we make operations for master and first 2 nodes, it means that first 3 nodes will run with Postgresql..
            // Newly added 4. or additional nodes won't need Postgresql configuration..
            // "jsonObject.nodeListWithoutMaster.length < 2" this condition prevents us from doing wasted operations 
            // for nodes that have already been configured. 
            let pgNodes = jsonObject.allNodesList.slice(0,2);
            logger.info(`Postgresql Clustering operations started`, "pgClusteringOperations", 98);
            let fileName = "/etc/postgresql/10/main/pg_hba.conf";
            let content = generatePgHbaConf(pgNodes);
            fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "pgClusteringOperations", 101); operationStatus=false; });

            // now we run the bucardo commands lying below;
            // first stop bucardo;
            runBashCommand("bucardo stop");
            // then give databases with ip and port;
            // bucardo add db atibadb1 dbname=atibadb host=192.168.255.241 port=5432 -> atibadb1 always will be node itself
            // bucardo add db atibadb2 dbname=atibadb host=192.168.255.242 port=5432
            // bucardo add db atibadb3 dbname=atibadb host=192.168.255.243 port=5432
            let commandLine = `bucardo add db atibadb1 dbname=atibadb host=${jsonObject.myIP} port=5432`
            runBashCommand(commandLine);

            let counter = 2;
            pgNodes.forEach(element => {
                if(element != jsonObject.myIP){
                    commandLine = `bucardo add db atibadb${counter} dbname=atibadb host=${jsonObject.myIP} port=5432`
                    runBashCommand(commandLine);
                    counter++
                }
            });

            counter = 2;

            // bucardo add all table db=atibadb1 -T loglar relgroup=rg_atiba
            // bucardo add all table db=atibadb1 -T loglar relgroup=rg_atiba2

            // bucardo add dbgroup dbgroup_atibadb atibadb1:source atibadb2:target
            // bucardo add dbgroup dbgroup_atibadb2 atibadb1:source atibadb3:target

            // bucardo add sync sync_atiba relgroup=rg_atiba dbgroup=dbgroup_atibadb
            // bucardo add sync sync_atiba2 relgroup=rg_atiba2 dbgroup=dbgroup_atibadb2

            // bucardo start
            // bucardo list sync -> if not master node run list sync

            commandLine = `bucardo add all table db=atibadb1 -T loglar relgroup=rg_atiba`;
            runBashCommand(commandLine);
            commandLine = `bucardo add all table db=atibadb1 -T loglar relgroup=rg_atiba2`;
            runBashCommand(commandLine);
            commandLine = `bucardo add dbgroup dbgroup_atibadb atibadb1:source atibadb2:target`;
            runBashCommand(commandLine);
            commandLine = `bucardo add dbgroup dbgroup_atibadb2 atibadb1:source atibadb3:target`;
            runBashCommand(commandLine);
            commandLine = `bucardo add sync sync_atiba relgroup=rg_atiba dbgroup=dbgroup_atibadb`;
            runBashCommand(commandLine);
            commandLine = `bucardo add sync sync_atiba2 relgroup=rg_atiba2 dbgroup=dbgroup_atibadb2`;
            runBashCommand(commandLine);
            commandLine = `bucardo start`;
            runBashCommand(commandLine);
            if(!jsonObject.isMaster){
                commandLine = `bucardo list sync`;
                runBashCommand(commandLine);
            }

        }else{
            logger.warning(`Not production environment`, "pgClusteringOperations", 156);
            let fileName = path.join(__dirname, "../static/pghbaconf.txt");
            // let content = generatePgHbaConf(`${((jsonObject.myIP.split('.')).slice(0,3)).join('')}.0`, 24);
            let content = generatePgHbaConf(jsonObject.allNodesList.slice(0,2));
            fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "pgClusteringOperations", 160); operationStatus=false; });
            runSystemCtl(jsonObject, "python");
        }
    }else{
        if(!jsonObject.isPostgreActive) runBashCommand("systemctl stop postgresql");
        logger.info(`Postgresql Clustering operations skipped and postgresql stopped, because no active postgresql on this node`, "pgClusteringOperations", 165);
    }

    if(operationStatus){
        logger.info(`Postgresql Clustering operations finished. STATUS : ${operationStatus}`, "pgClusteringOperations", 169);
    }else{
        logger.error(`Postgresql Clustering operations finished. STATUS : ${operationStatus}`, "pgClusteringOperations", 171);
    }
    return operationStatus;
}

exports.haProxyOperations = (jsonObject) => {
    let operationStatus=true;
    logger.info(`HA Proxy operations started`, "haProxyOperations", 185);
    if(env.IN_PRODUCTION){
        // haproxy.cfg file will be generated and saved to directory /etc/haproxy
        let fileName = "/etc/haproxy/haproxy.cfg"
        let nodesList = jsonObject.allNodesList.toString().split(",");
        let content = generateHaProxyCfg(nodesList);
        fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "haProxyOperations", 185); operationStatus=false; });
        // change mod command will be run;
        dir = exec(`chmod 644 ${fileName}`, function(err, stdout, stderr) {
            if (err) {
                logger.error(`An error occurred trying to run command "chmod 644 ${fileName}". ERROR IS : ${err}`, "haProxyOperations", 188);
                operationStatus = false;
            }
            logger.info(`"chmod 644 ${fileName}" command returns ${stdout}`, "haProxyOperations", 191);
        });
        runSystemCtl(jsonObject, "haproxy");
    }else{
        logger.warning(`Not production environment`, "haProxyOperations", 195);
        let fileName = path.join(__dirname, "../static/haproxycfg.txt");

        //logger.debug(`Type Of allNodesList ${typeof jsonObject.allNodesList.toString().split(",")}, ${jsonObject.allNodesList.toString().split(",").length}`, "haProxyOperations", 137)
        let nodesList = jsonObject.allNodesList.toString().split(",");
        let content = generateHaProxyCfg(nodesList);
        fs.writeFile(fileName, content, (err) => { if(err) logger.error(`ERROR IS : ${err}`, "haProxyOperations", 201); operationStatus=false; });
        runSystemCtl(jsonObject, "python");
    }
    if(operationStatus){
        logger.info(`HA Proxy operations finished. STATUS : ${operationStatus}`, "haProxyOperations", 205);
    }else{
        logger.error(`HA Proxy operations finished. SATUS : ${operationStatus}`, "haProxyOperations", 207);
    }
    return operationStatus;
}

let runSystemCtl = (jsonObject, serviceName) => {
    /** to run systemctl command according to nodes status like new or old */
    if(env.IN_PRODUCTION){
        if(jsonObject.myIP in jsonObject.newNodesList){
            dir = exec(`systemctl restart ${serviceName}`, function(err, stdout, stderr) {
                if (err) {
                    logger.error(`An error occurred trying to run command "systemctl restart ${serviceName}". ERROR IS : ${err}`, "runSystemCtl", 218)
                }
                logger.info(`"systemctl restart ${serviceName}" command returns ${stdout}`, "runSystemCtl", 220);
            });
        }else{
            dir = exec(`systemctl reload ${serviceName}`, function(err, stdout, stderr) {
                if (err) {
                    logger.error(`An error occurred trying to run command "systemctl reload ${serviceName}". ERROR IS : ${err}`, "runSystemCtl", 225)
                }
                logger.info(`"systemctl reload ${serviceName}" command returns ${stdout}`, "runSystemCtl", 227);
            });
        }
    }else{
        if(jsonObject.myIP in jsonObject.newNodesList){
            dir = exec(`${serviceName} ${serviceName=="node"?"-v":"--version"}`, function(err, stdout, stderr) {
                if (err) {
                    logger.error(`An error occurred trying to run command node -v. ERROR IS : ${err}`, "runSystemCtl", 234)
                }
                logger.info(`${serviceName} ${serviceName=="node"?"-v":"--version"} command returns for new node ${stdout}`, "runSystemCtl", 236);
            });
        }else{
            dir = exec(`${serviceName} ${serviceName=="node"?"-v":"--version"}`, function(err, stdout, stderr) {
                if (err) {
                    logger.error(`An error occurred trying to run command python --version. ERROR IS : ${err}`, "runSystemCtl", 241)
                }
                logger.info(`${serviceName} ${serviceName=="node"?"-v":"--version"} command returns for existing node ${stdout}`, "runSystemCtl", 243);
            });
        }
    }
        
}

let runBashCommand = (commandString) => {
    /** to run custom commands */
    if(env.IN_PRODUCTION){
        dir = exec(`${commandString}`, function(err, stdout, stderr) {
            if (err) {
                logger.error(`An error occurred trying to run command "${commandString}". ERROR IS : ${err}`, "runBashCommand", 255)
            }
            logger.info(`"${commandString}" command returns ${stdout}`, "runBashCommand", 257);
        });
    }else{
        logger.warning(`We are not in production environment`, "runBashCommand", 260)
    }
}

exports.arrangeElasticForNodeRemove = (jsonObject) => {
    /**
     * To prepare elastic cluster for new condition, it means help it to manage replicas, indexing and shards 
     * without an existing node
     */
        let operationStatus=true;
        logger.info(`Arranging Elasticsearch for node remove operations started`, "arrangeElasticForNodeRemove", 270);
        let nodeIpToRemove = jsonObject.removeNode;
        if(env.IN_PRODUCTION){
            // In production environment;
            try{
                // 1
                let commandString = `curl -XPUT localhost:9200/_cluster/settings -H 'Content-Type: application/json' -d '{ "transient" :{ "cluster.routing.allocation.exclude._ip" : "${nodeIpToRemove}" } }'`
                runBashCommand(commandString);

                // 2
                if(!(jsonObject.roles).includes("voting_only")){
                    // it means it's a master-eligible node, not a voting_only node;
                    commandString = `curl -X POST "localhost:9200/_cluster/voting_config_exclusions?node_names=${jsonObject.nodeID}&timeout=1m&pretty"`;
                    runBashCommand(commandString);
                }

                // 3
                commandString = `curl -X DELETE "localhost:9200/_cluster/voting_config_exclusions?wait_for_removal=false&pretty"`;
                runBashCommand(commandString);

            }catch(err){
                logger.error(`An error occurred trying to remove node ${nodeIpToRemove} ERROR IS : ${err}.`, "arrangeElasticForNodeRemove", 278);
                operationStatus = false
            }
            
        }else{
            // In test environment;
            if(!(jsonObject.roles).includes("voting_only")) logger.debug(`it'is master-eligible node : ${jsonObject.roles}`)
            logger.warning("You are not in production environment, do not expect logical results ... ", "arrangeElasticForNodeRemove", 298)
        }
    /**
     * Instruction of operation work flow :
     *
        Öncelikle şunu çalıştırıp shardların reallocate etmesini sağlayacağız:

        curl -XPUT localhost:9200/_cluster/settings -H 'Content-Type: application/json' -d '{
        "transient" :{
            "cluster.routing.allocation.exclude._ip" : "<ip_of_the_removal_node>"
        }
        }'
        Master-eligible node çıkarmak için önce bu çalışıyor: timeout 1 min
        curl -X POST "localhost:9200/_cluster/voting_config_exclusions?node_names=node_name&timeout=1m&pretty"

        çıkarıldıktan sonra ise:
        curl -X DELETE "localhost:9200/_cluster/voting_config_exclusions?pretty"
        fakat kapatılmasını beklemeden çıkarmak için şunu kullanabiliriz: (böylece node kapanmasını bekleme komutundan kurtuluruz) 
        curl -X DELETE "localhost:9200/_cluster/voting_config_exclusions?wait_for_removal=false&pretty"
     */
    return operationStatus;
}