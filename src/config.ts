/**
 * Файл генерирующий объект конфигурации со всеми
 *  необходимыми для работы приложения параметрами
 */

import dotenv from "dotenv";
import * as path from "path";
import { validateEnv } from "./utils/validateEnv";

dotenv.config({
	path: path.join(__dirname, ".env")
});

const env = validateEnv(process.env);

const config = {
	server: {
		host: "localhost",
		port: env.SERVER_PORT,
		jwtSecret: env.JWT_SECRET,
		jwtRefreshSecret: env.JWT_REFRESH_SECRET,
		tokenExpirationTime: "15m",
		refreshTokenExpirationTime: "24h"
	},
	database: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		name: env.DB_NAME,
		username: env.DB_USER,
		password: env.DB_PASSWORD
	},
	parseTokens: {
		udemyAuthHeader: env.UDEMY_AUTH_HEADER
	}
};

export default config;
