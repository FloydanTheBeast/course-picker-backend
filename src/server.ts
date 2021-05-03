import "reflect-metadata";
import App from "./app";
import config from "./config";
import {
	AuthController,
	CategoryController,
	CourseController,
	ParseController, ReviewController, UserController
} from "./controllers";
import logger from "./utils/logger";

const app = new App({
	cors: true,
	middlewares: [__dirname + "/middlewares/**/*.*(ts|js)"],
	controllers: [AuthController, ParseController, CourseController,
		CategoryController, UserController, ReviewController]
});

app.listen(config.server.port, () => {
	logger.success(
		`Server started at ${config.server.host}:${config.server.port}`
	);
});
