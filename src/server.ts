import "reflect-metadata";
import App from "./app";
import config from "./config";
import {AuthController, ParseController, CourseController} from "./controllers";

const app = new App({
	cors: true,
	middlewares: [__dirname + "/middlewares/**/*.ts"],
	controllers: [AuthController, ParseController, CourseController]
});

app.listen(config.server.port, () => {
	console.log(
		`Server started at ${config.server.host}:${config.server.port}`
	);
});
