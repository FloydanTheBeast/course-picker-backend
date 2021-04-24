import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import path from "path";
import {
	Action,
	RoutingControllersOptions,
	useExpressServer
} from "routing-controllers";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import config from "./config";
import logger from "./utils/logger";

const swaggerDoc = YAML.load(path.join(__dirname, "openapi.yml"));

class App {
	private server: express.Application;
	private db: mongoose.Connection;

	constructor(options: RoutingControllersOptions) {
		this.server = express();
		this.server.use(
			"/api-docs",
			swaggerUi.serve,
			swaggerUi.setup(swaggerDoc)
		);

		mongoose.connect(
			`mongodb://${config.database.username}:${config.database.password}@` +
				`${config.database.host}:${config.database.port}/${config.database.name}?authSource=admin`,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useCreateIndex: true,
				useFindAndModify: false
			}
		);

		this.db = mongoose.connection;
		this.db.on("error", () => {
			logger.error("MongoDB connection error");
		});

		this.db.on("open", () => {
			logger.success("MongoDB successfully connected");
		});

		useExpressServer(this.server, {
			authorizationChecker: async (action: Action): Promise<boolean> => {
				const authHeader = action.request.headers["authorization"];

				if (authHeader && typeof authHeader === "string") {
					const token = authHeader.split(" ")[1];
					try {
						jwt.verify(token, config.server.jwtSecret);
						return true;
					} catch (error) {
						return false;
					}
				}

				return false;
			},
			defaultErrorHandler: false,
			...options
		});
	}

	public listen(port: number, callback?: () => void | undefined): void {
		this.server.listen(port, callback);
	}
}

export default App;
