import "reflect-metadata";
import App from "./app";
import config from "./config";
import {
	AuthController,
	CourseController,
	ParseController
} from "./controllers";
import logger from "./utils/logger";

const app = new App({
	cors: true,
	middlewares: [__dirname + "/middlewares/**/*.ts"],
	controllers: [AuthController, ParseController, CourseController]
});

app.listen(config.server.port, () => {
	logger.success(
		`Server started at ${config.server.host}:${config.server.port}`
	);
});
