/**
 * @author istiklal
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const clusterController = require("../controllers/atibaClusterController");

const Logger = require('../logger');
const logger = new Logger("cluster_router");


//router.get("/", clusterController.getHome);
//router.get("/health_check", clusterController.healthOfApi);
router.get("/status", clusterController.getClusterStatus);
// router.get("/add_node", clusterController.addNodeToCluster);
router.get("/change_struct", clusterController.changeNodeStructForCluster);
router.get("/remove_node", clusterController.removeNodeFromCluster);

router.post("/add_node", clusterController.addNodeToCluster);
router.post("/change_struct", clusterController.changeNodeStructForCluster);
router.post("/remove_node", clusterController.removeNodeFromCluster);

exports.router = router;
