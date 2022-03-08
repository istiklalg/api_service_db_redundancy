/**
 * @author istiklal
 */

const qs = require("querystring");
const { exec } = require("child_process");
const Logger = require('../logger');
const logger = new Logger("cluster_controller");
const operator = require("../functionalities/atibaClusterFunctions");
const { json } = require("express");

// exports.getHome = (req, res, next) => {
    
// }

// exports.healthOfApi = (req, res, next) => {
    
// }

exports.getClusterStatus = (req, res, next) => {
    logger.info(`request for cluster (${req.url}), (${req.title}), (${req.body})`, "getClusterStatus", 19);
    /**
     * functions that gives you the current status of cluster.
     */
    let status = "success"
    let code = 0
    dir = exec(`bucardo status`, function(err, stdout, stderr) {
        if (err) {
            logger.error(`An error occurred trying to run command "bucardo status". ERROR IS : ${err}`, "getClusterStatus", 28);
            status = `${err}`;
            code = 1
        }else{
            logger.info(`"bucardo status" command returns ${stdout}`, "getClusterStatus", 32);
        }
        context = {title:"Cluster Status", status, code};
        res.send(context);
    });
}

exports.addNodeToCluster = (req, res, next) => {
    logger.info(`request to add node to cluster`,"addNodeToCluster", 40);
    /**
     * function that  make operations of adding new node to current cluster.
     */
    logger.debug(`myIP in BODY of ${req.method} request : ${req.body.myIP}`)
    // logger.debug(`Body of ${req.method} request : ${req.body.isMaster}`)
    let sampleJson;
    let processResult;
    let resultCode;
    if(req.method=="POST" || req.method=="post"){
        sampleJson = req.body.myIP ? req.body : {myIP:""};
        //sampleJson.isMaster = sampleJson.isMaster=="True"?true:false
        //sampleJson.priorityNumber = parseInt(sampleJson.priorityNumber)
    }else{
        sampleJson = {
                myIP:"192.168.250.12",
                nodeID:"node-19216825012",
                isMaster:false, 
                priorityNumber:140, 
                masterIP:"198.168.250.10", 
                nodeListWithoutMaster:["192.168.250.11","192.168.250.12"],
                newNodesList:["192.168.250.13", "192.168.250.14"],
                allNodesList:["198.168.250.10","192.168.250.11","192.168.250.12","192.168.250.13", "192.168.250.14"],
                roles: "[ master, data ]",
                //roles: "[ master, voting_only, data ]",
                isPostgreActive:true,
                removeNode: ""
            }
    }
    if((sampleJson.myIP)==""){
        logger.error(`Couldn't parse json object from request body, we just got : ${sampleJson} as object`, "addNodeToCluster", 70);
        context = {title:"Add New Node Operation Failed", status:"error", code:1};
    }else{
        // 1- start keepalived operations
        processResult = operator.linuxHaOperations(sampleJson);
        // 2- start haproxy operations
        processResult = processResult && operator.haProxyOperations(sampleJson);
        // 3- start postgresql operations
        processResult = processResult && operator.pgClusteringOperations(sampleJson);
        // 4- start elasticsearch operations
        processResult = processResult && operator.esClusteringOperations(sampleJson);

        resultCode = processResult?0:1;
        context = {title:"Add New Node Operation Finished Successfully", status:`${processResult?"success":"error"}`, code:resultCode};
    }
    res.send(context);
}

exports.removeNodeFromCluster = (req, res, next) => {
    logger.info(`request to remove node from cluster`, "removeNodeFromCluster", 89);
    /**
     * function that removes given node from cluster structure and rearrange rest of nodes in cluster.
     */
    logger.debug(`myIP & removeNode in BODY of ${req.method} request : ${req.body.myIP} & ${req.body.removeNode}`, "removeNodeFromCluster", 93);
    // logger.debug(`Body of ${req.method} request : ${req.body.isMaster}`)
    let sampleJson;
    let processResult;
    let resultCode;
    context = {title:"Remove Node"};
    if(req.method=="POST" || req.method=="post"){
        sampleJson = req.body.myIP || req.body.removeNode ? req.body : {myIP:"", removeNode:"", newNodesList:[]};
    }else{
        logger.info(`GET request for /remove_node`, "removeNodeFromCluster", 102);
        sampleJson = {
            myIP:"192.168.250.13",
            nodeID:"node-19216825013",
            isMaster:false, 
            priorityNumber:140, 
            masterIP:"198.168.250.10", 
            nodeListWithoutMaster:["192.168.250.11","192.168.250.13", "192.168.250.14"],
            newNodesList:[],
            allNodesList:["198.168.250.10","192.168.250.11","192.168.250.13", "192.168.250.14"],
            roles: "[ master, data ]",
            //roles: "[ master, voting_only, data ]",
            isPostgreActive:true,
            removeNode: "192.168.250.12"
        }
        context = {title:`Removing Node ...`, sampleJson};
        // res.send(context);
    }
    if((sampleJson.myIP)==""){
        logger.error(`Couldn't parse json object from request body, we just got : ${sampleJson} as object`, "removeNodeFromCluster", 121);
        context = {title:"Remove Node Operation Failed", status:"error", code:1};
    }else{
        logger.info(`Node remove operation started for ip ${sampleJson.removeNode} on node with ip ${sampleJson.myIP}`, "removeNodeFromCluster", 124);
        // All Operations will run in this case;
        // prepare elastic for node remove operations;
        processResult = operator.arrangeElasticForNodeRemove(sampleJson);
        // when finish this operation, we start add node operations with empty newNodesList;
        // sampleJson.newNodesList = sampleJson.newNodesList.length == 0 ? sampleJson.newNodesList : [];
        logger.info(`Rearrange rest of nodes operation started on node with ip ${sampleJson.myIP}`, "removeNodeFromCluster", 132);
        // 1- start keepalived operations
        processResult = processResult && operator.linuxHaOperations(sampleJson);
        // 2- start haproxy operations
        processResult = processResult && operator.haProxyOperations(sampleJson);
        // 3- start postgresql operations
        processResult = processResult && operator.pgClusteringOperations(sampleJson);
        // 4- start elasticsearch operations
        processResult = processResult && operator.esClusteringOperations(sampleJson);

        resultCode = processResult?0:1;
        context = {title:"Remove Node Operation Finished Successfully", status:`${processResult?"success":"error"}`, code:resultCode};
    }
    res.send(context);
}

exports.changeNodeStructForCluster = (req, res, next) => {
    logger.info(`request for rearrange node structure for current cluster`, "changeNodeStructForCluster", 88);
    /**
     * function that rearrange closter node structure for current cluster.
     */
     context = {title:"Rearrange Nodes"};
     res.send(context);
}