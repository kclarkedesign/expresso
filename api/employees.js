const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

module.exports = employeesRouter;

employeesRouter.get('/', (res, req, next) => {
	db.all('SELECT * FROM Employee WHERE Employee.is_current_employee', (error, employees) => {
		if(error) {
			next(error);
		} else {
			res.status(200).json({ employees: employees });
		}
	});
});