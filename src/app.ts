import express from "express";
import mongoose from "mongoose";
import {
	RoutingControllersOptions,
	useExpressServer
} from "routing-controllers";
import config from "./config";

class App {
	private server: express.Application;
	private db: mongoose.Connection;

	constructor(options: RoutingControllersOptions) {
		this.server = express();
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

		useExpressServer(this.server, options);
	}

	public listen(port: number, callback?: () => void | undefined): void {
		this.server.listen(port, callback);
	}
}

export default App;
