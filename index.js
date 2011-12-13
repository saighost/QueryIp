var http = require('http'),
	net = require('net'),
	fs = require("fs"),
	url = require("url");
	
var ipAddress = {};
var max = 256;
var count = 0;

fs.readFile('ip.txt','utf8', function (err, data) {
  if(err) {
	console.log(err);
	return;
  }
  var content = data.toString('utf-8');
  var array = content.split("\n");
  for(i=0;i<array.length;i++){
	var line = array[i].split(/\s+/g);
	ipAddress[line[0]] = [line[1],line[2],line.slice(3).join('')];
  }
});

http.createServer(function (req, res) {
	
	
	var remoteAddress = res.connection.remoteAddress;
	
	console.log("from: "+ remoteAddress+" path:"+req.url);
	if (req.url == "/favicon.ico") {
		res.writeHead(404, "Not Found");
		res.end();
		return;
	}
	
	res.writeHead(200, {"content-type":"text/html;charset=utf8"});
	
	if (req.url == "/max") {
		res.end("{'max':'"+max+"'}");
		return;
	}
	
	var _urlMap;
    req.get = function (key) {
        if (!_urlMap) {
            urlMap = url.parse(req.url, true);
        }
        return urlMap.query[key];
    };
	
	if(req.get("ip")){
        if(net.isIPv4(req.get("ip"))){
            res.write("{'"+req.get("ip")+"':'"+queryIp(req.get("ip"))+"'}\n");
	    }else{
            res.write("获取的IP不正确:"+req.get("ip"));
	    }
		
	}else if(net.isIPv4(remoteAddress)){
		res.write("{'"+remoteAddress+"':'"+queryIp(remoteAddress)+"',");
		res.write("'description':'加ip参数可以查询指定IP.如：http://queryip.cnodejs.net/?ip=123.123.123.123'}\n");
	}else{
		if(net.isIP(remoteAddress)){
			res.write("{'Not find':'对不起,目前没有IPv6的数据.'}");
		}else{
			res.write("获取的IP不正确:"+remoteAddress);
		}
	}
	res.end();
	
	res.end();
	
}).listen(80, "127.0.0.1");
    
function queryIp(data){
	if(count > max){
		max = count;
		console.log("MAX:"+max);
	}
	count = 0;
	var start = data.split(".");
	start.pop();
	start.push('0');
	return isInRange(data,start);
}
function isInRange(data,start){
	count++;
	var index = start.join('.');
	if(ipAddress[index]){
		var endIp = ipAddress[index][0];
		var max = ip2number(endIp);
		var last = ip2number(data);
		if(last<=max){
			return ipAddress[index][1]+","+ipAddress[index][2];
		}else{
			return isInRange(data,getNextRange(endIp.split(".")));
		}
	}else{
		start.pop();
		var pre = getPreviousRange(start);
		pre.push('0');
		return isInRange(data,pre);
	}
	return "未知!";
}
// num = (a<<24)|(b<<16)|(c<<8)|d;
function ip2number(data){
	if()
	var part = data.split(".");
	part.reverse();
	var num = part[0];
	for(i=1;i<part.length;i++){
		num = num|(part[i]<<(8*i));
	}
	return num;
}

function number2ip(num){
	var part = new Array();
	part[0] = (num & 4278190080) >> 24;
	part[1] = (num & 16711680) >> 16;
	part[2] = (num & 65280) >> 8;
	part[3] =  num & 255;
	return part;
}

function getNextRange(part){
	return number2ip(ip2number(part.join("."))+1);
}
function getPreviousRange(part){
	var end = part.pop();
	if(end>0){
		part.push(end-1);
		return part;
	}else{
		var pre;
		if(part.length>0){
			pre = getPreviousRange(part);
		}else{
			//虽然这种情况不会发生，但是保持逻辑的完整仍然加入此段。
			pre = part;
		}
		pre.push(end);
		return pre;
	}
}
console.log('Server running at http://127.0.0.1:80/');