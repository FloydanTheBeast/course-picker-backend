/**
 * Файл генерирующий объект конфигурации со всеми
 *  необходимыми для работы приложения параметрами
 */

import dotenv from "dotenv";
import * as path from "path";

dotenv.config({
	path: path.join(__dirname, ".env")
});

const config = {
	server: {
		host: "localhost",
		port: Number(process.env.SERVER_PORT),
		jwtSecret: process.env.JWT_SECRET || "8864f61af0e543d3aa83cc2113a98ef9"
	},
	database: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		password: process.env.DB_PASSWORD
	}
};

export default config;
