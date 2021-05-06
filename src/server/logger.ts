import * as winston from 'winston';

export const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		// Always log errors to logs/error.log
		new winston.transports.File({filename: 'logs/error.log', level: 'error'}),
	],
});
if (process.env.NODE_ENV === 'development') {
	// If this application is in development mode, then log everything to the
	// console
	logger.add(new winston.transports.Console({format: winston.format.simple()}));
}
