import "reflect-metadata";
import App from "./app";
import config from "./config";
import {
	AuthController,
	CategoryController,
	CourseController,
	ParseController, ReviewController, UserController,
	CompilationController
} from "./controllers";
import logger from "./utils/logger";
import FilterController from "./controllers/FilterController";

const app = new App({
	cors: true,
	middlewares: [__dirname + "/middlewares/**/*.*(ts|js)"],
	controllers: [AuthController, ParseController, CourseController,
		CategoryController, UserController, ReviewController,
		CompilationController,	FilterController]
});

app.listen(config.server.port, () => {
	logger.success(
		`Server started at ${config.server.host}:${config.server.port}`
	);
});
