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

employeesRouter.post('/', (req, res, next) => {
	const employee = req.body.employee;
	const name;
	const position;
	const wage;
	const isCurrentEmployee = employee.isCurrentEmployee === 0 ? 0 : 1;

	if(!name || !position || !wage) {
		return res.sendStatus(400);
	}

	const query = `INSERT INTO Employee (
					name,
					position,
					wage,
					is_current_employee)
				Values (
					$name,
					$position,
					$wage,
					$isCurrentEmployee)`;
	const values = {
		$name: name,
		$position: position,
		$wage: wage,
		$isCurrentEmployee: isCurrentEmployee
	};

	db.run(query, values, function(error) {
		if(error) {
			next(error);
		} else {
			db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, function(error, employee) {
				res.status(201).json({ employee: employee });
			});
		}
	})
});