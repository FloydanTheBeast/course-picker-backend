import { cleanEnv, port, str } from "envalid";

export function validateEnv(env: unknown) {
	return cleanEnv(env, {
		SERVER_PORT: port({
			desc: 'Порт веб-сервера, по которому он "слушает" запросы'
		}),
		DB_HOST: str({ desc: "Хост базы данных" }),
		DB_PORT: port({ desc: "Порт базы данных" }),
		DB_NAME: str({ desc: "Имя базы данных" }),
		DB_USER: str({ desc: "Имя пользователя базы данных" }),
		DB_PASSWORD: str({ desc: "Пароль от пользователя базы данных" }),
		JWT_SECRET: str({ default: "7855b9307fa24bb785f2deaa9c702930" }),
		JWT_REFRESH_SECRET: str({
			default: "04bbed8fb6ed42c9815a5ecf8eb9b10c"
		}),
		UDEMY_AUTH_HEADER: str()
	});
}
