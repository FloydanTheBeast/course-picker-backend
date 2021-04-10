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
			`mongodb://${config.database.host}:${config.database.port}/coursepicker`,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useCreateIndex: true
			}
		);
		this.db = mongoose.connection;
		this.db.on("error", () => {
			console.error("MongoDB connection error");
		});

		useExpressServer(this.server, {
			authorizationChecker: async (action: Action): Promise<boolean> => {
				const token = action.request.headers["authorization"].split(
					" "
				)[1];
				try {
					jwt.verify(token, config.server.jwtSecret);
					return true;
				} catch (error) {
					return false;
				}
			},
			...options
		});
	}

	public listen(port: number, callback?: () => void | undefined): void {
		this.server.listen(port, callback);
	}
}

export default App;
