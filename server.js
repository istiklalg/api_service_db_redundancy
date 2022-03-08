/**
 *@author:istiklal
 */

const env = require("./configuration")
const Logger = require('./api/logger');
const express = require('express');
var cors = require("cors");

const bodyParser = require("body-parser");
const path = require("path");

const cluster = require("./api/routes/atibaClusterRoutes")

const app = express();
var port = env.PORT_NUMBER;
var apiKey = env.API_KEY;
var logger = new Logger("main");

app.use(cors());

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(express.json());

app.use(express.static(path.join(__dirname, "./api/static")));

app.use("*", (req, res, next) => {
  const query = req.query;
  console.log(req.method, ` request base url : `, req.baseUrl);
  logger.info(`${req.method} request for URL : ${req.baseUrl}`, "main", 32);
  console.log(req.method, ` request query : `, query);
  console.log(req.method, ` request body : `, req.body);
  if(query.api_key) {
    if(query.api_key==apiKey){
      logger.info(`We got expected key ...`, "main", 38);
      logger.info(`${req.method} request for url : ${req.baseUrl}`, "main", 38)
      next();
    }else{
      logger.error("request with wrong API KEY ! Process broken !", "main", 41);
      context = {title:"WRONG API KEY", status:"Error : Key is wrong", code:11};
      res.send(context);
    }
  }else{
    logger.error("request with no API KEY ! Process broken !", "main", 46);
    //env.sleep(5000).then(() => { logger.debug("After sleep for 5 seconds", "main", 47); })
    context = {title:"MISSING API KEY", status:"Error : Key is missing", code:10};
    res.send(context);
  }    
});

app.use("/health_check", (req, res, next) => {
  logger.info(`request for api health check`, "main", 54);
    /**
     * function that returns api health status.
     */
    // service health check procedure in python check_service_status function;
    //  try:
    //       _status_code = os.system('systemctl status ' + service_name)
    //       _is_running = True if _status_code == 0 else False
    //       _status = "Ok" if _status_code == 0 else "Not running"
    //       _result = {"name": service_name, "code": _status_code, "status": _status, "is_running": _is_running}
    //   except Exception as err:
    //       logger.exception(f"An error occurred trying to get status of {service_name}. ERROR IS : {err}")
    //       _result = {"name": service_name, "code": 9999, "status": f"Error : {err}", "is_running": False}
    //   return _result
    context = {title:"API Health Status", name:"atibaApiService", code:0, status:"Ok", is_running:true};
    res.send(context);
})

app.use("/cluster", cluster.router);

app.use("/", (req, res, next) => {
  if(req.baseUrl=="/"){
    logger.info(`request for api home page`, "main", 76);
      /**
       * home page of api service.
       * we use it as a healthcheck of api for now
       */
      context = {title:"Hello there", status:"success", code:0};
      res.send(context);  
  }else{
    context = {title:"Invalid URL request", status:"error", code:404}
    res.send(context);
    // res.status(404).send("<h1>No response for your request</h1>");
  }
  
});

// app.use((req, res) => {
//   res.status(404).send("<h1>No response for your request</h1>");
// });

app.listen(port, ()=>{
  logger.info(`atibaApiService started with \x1b[36m${env.IN_PRODUCTION?"production":"development"}\x1b[0m settings & listen on port : \x1b[36m${port}\x1b[0m`);
});

