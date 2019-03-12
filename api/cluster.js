var cluster = require('cluster');
if (cluster.isMaster){
    require('os').cpus().forEach(function () {
      var worker = cluster.fork();
      console.log('CLUSTER: Worker %d started', worker.id);
    });
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster.', worker.id);
    });
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.id, code, signal);
        var worker = cluster.fork();
        console.log('CLUSTER: Worker %d started', worker.id);
    });
}
else{
    require('./app');
}
