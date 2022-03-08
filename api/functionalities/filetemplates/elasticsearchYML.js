/**
 * @author istiklal
 */

 exports.generateElasticsearchYML = (isMaster, nodeID, roles, allNodesList) => {
    /**
     * Function to generate elasticsearch.yml file content for nodes
     * node-1 master node !!
     */
    let part1 = `# This file is written by atibaApiService
# /etc/elasticsearch/elasticsearch.yml file
cluster.name: AtibaEsCluster

# impotant name is node-nodeNumber
node.name: ${nodeID}

# node-1 and node-2 must be like [ master, data ], all the others like [ master, voting_only, data ]. comes from python..
node.roles: ${roles}

path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
bootstrap.memory_lock: true
network.host: 0.0.0.0
http.port: 9200

# not ordered !!
cluster.initial_master_nodes: ["${allNodesList.join('", "')}"]
discovery.zen.ping.unicast.hosts: ["${allNodesList.join('", "')}"]

discovery.zen.minimum_master_nodes: 1
thread_pool:
    search:
        size: 50
        queue_size: 1000
indices.memory.index_buffer_size: 512mb
xpack.ml.enabled: false
xpack.security.enabled: false
xpack.monitoring.enabled: false
search.allow_expensive_queries: false
indices.fielddata.cache.size:  20%
#indices.breaker.fielddata.limit:40%
#indices.breaker.request.limit:30%
#indices.breaker.total.limit:50%
`
    return part1
}