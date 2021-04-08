import "reflect-metadata";
import App from "./app";
import config from "./config";
import { AuthController } from "./controllers";

const app = new App({
	cors: true,
	controllers: [AuthController]
});

app.listen(config.server.port, () => {
	console.log(
		`Server started at ${config.server.host}:${config.server.port}`
	);
});
