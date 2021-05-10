import http from "https";
import axios from "axios";
import iconv from "iconv-lite";

export function get(url: string, headers: any = {}, reposnseType : string = 'text') {
	const options : {[k: string] : unknown} = {};
	options.headers = headers;
	options.responseEncoding = 'utf8';
	options.responseType = reposnseType;
	options.timeout = 30000;

	return axios.get(url, options).then(function (response) {
		return response.data;
	});
}


export function post(url: string, headers: any = {}, reposnseType : string = 'text', postData : any) {
	const options : {[k: string] : unknown} = {};
	options.method = 'post';
	options.headers = headers;
	options.responseEncoding = 'utf8';
	options.responseType = reposnseType;
	options.timeout = 30000;
	options.data = postData;

	return axios.post(url, postData, options).then(function (response) {
		return response.data;
	}).catch(function (error) {
		if (error.response) {
			// The request was made and the server responded with a status code
			// that falls out of the range of 2xx
			console.log(error.response.data);
			console.log(error.response.status);
			console.log(error.response.headers);
		} else if (error.request) {
			// The request was made but no response was received
			// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
			// http.ClientRequest in node.js
			console.log(error.request);
		} else {
			// Something happened in setting up the request that triggered an Error
			console.log('Error', error.message);
		}
		console.log(error.config);
	});
}