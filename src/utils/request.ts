import http from "https";
import iconv from "iconv-lite";

export function get(url: string, headers: any = {}) {
	return new Promise<string>((resolve, reject) => {
		http.get(
			url,
			{
				headers: headers,
			},
			(resp: any) => {
				let data = "";

				// A chunk of data has been received.
				resp.on("data", (chunk: any) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on("end", () => {
					resolve(data);
				});
			}
		).on("error", (err: any) => {
			reject(err);
		});
	});
}
