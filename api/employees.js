const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

module.exports = employeesRouter;

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
	db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1', (error, employees) => {
		if(error) {
			next(error);
		} else {
			res.status(200).json({ employees: employees });
		}
	});
});

employeesRouter.post('/', (req, res, next) => {
	const employee = req.body.employee;
	const name = employee.name;
	const position = employee.position;
	const wage = employee.wage;
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
			db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, function(error, employee) {
				res.status(201).json({ employee: employee });
			});
		}
	})
});

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
	const query = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
	const values = { $employeeId: employeeId };
	db.get(query, values, (error, employee) => {
		if (error) {
			next(error)
		} else if (employee) {
			req.employee = employee;
			next();
		} else {
			res.sendStatus(404);
		}
	});
});

employeesRouter.get('/:employeeId', (req, res, next) => {
	res.status(200).json({ employee: req.employee });
});


employeesRouter.put('/:employeeId', (req, res, next) => {
	const employee = req.body.employee;
	const name = employee.name;
	const position = employee.position;
	const wage = employee.wage;
	const isCurrentEmployee = employee.isCurrentEmployee === 0 ? 0 : 1;
	if(!employee || !name || !position || !wage) {
		res.sendStatus(400);
	} else {
		const query = `UPDATE Employee 
			SET name = $name, 
				position = $position, 
				wage = $wage, 
				is_current_employee = $isCurrentEmployee 
			WHERE Employee.id = $employeeId`;
		const values = {
			$name: name,
			$position: position,
			$wage: wage,
			$isCurrentEmployee: isCurrentEmployee,
			$employeeId: req.params.employeeId
		};

		db.run(query, values, (error) => {
			if(error) {
				next(error);
			} else {
				db.get(`SELECT * FROM Employee WHERE Employee.id = ${values.$employeeId}`, (error, employee) => {
					res.status(200).json({ employee: employee });
				});
			}
		});
	}
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
	const thisEmployeeId = req.params.employeeId;
	db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${thisEmployeeId}`, (error) => {
		if(error) {
			next(error);
		} else {
			db.get(`SELECT * FROM Employee WHERE Employee.id = ${thisEmployeeId}`, (error, employee) => {
				res.status(200).json({ employee: employee });
			});
		}
	})
});