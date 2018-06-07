const express = require('express');
const timesheetsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

module.exports = timesheetsRouter;

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
	const query = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
	const values = { $timesheetId: timesheetId };
	db.get(query, values, (error, timesheet) => {
		if(error) {
			next(error)
		} else if (timesheet) {
			req.timesheet = timesheet;
			next();
		} else {
			res.sendStatus(404);
		}
	});
});

timesheetsRouter.get('/', (req, res, next) => {
	db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.params.employeeId}`, (error, timesheets) => {
		if (error) {
			next(error);
		} else {
			res.status(200).json({ timesheets: timesheets });
		}
	});
});

timesheetsRouter.post('/', (req, res, next) => {
	const timesheet = req.body.timesheet;
	const hours = timesheet.hours;
	const rate = timesheet.rate;
	const date = timesheet.date;
	const employeeId = req.params.employeeId;
	db.get(`SELECT * FROM Employee WHERE Employee.id = ${employeeId}`, (error) => {
		if(error) {
			next(error);
		} else {
			if(!hours || !rate || !date || !employeeId) {
				return res.sendStatus(400);
			} else {
				const query = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)';
				const values = { 
					$hours: hours,
					$rate: rate,
					$date: date,
					$employeeId: employeeId
				};
				db.run(query, values, function(error) {
					if(error) {
						next(error);
					}
					db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, timesheet) => {
						res.status(201).json({ timesheet: timesheet });
					});
				});
			}
		}
		
	});
});

timesheetsRouter.put('/:timesheetId', (req, res, next) => {
	const timesheet = req.body.timesheet;
	const hours = timesheet.hours;
	const rate = timesheet.rate;
	const date = timesheet.date;
	const employeeId = req.params.employeeId;
	if(!hours || !rate || !date || !employeeId) {
		return res.sendStatus(400);
	} else {
		const query = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId';
		const values = { 
			$hours: hours,
			$rate: rate,
			$date: date,
			$employeeId: employeeId,
			$timesheetId: req.params.timesheetId,
		};

		db.run(query, values, (error) => {
			if(error) {
				next(error);
			} else {
				db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${values.$timesheetId}`, (error, timesheet) => {
					res.status(200).json({ timesheet: timesheet });
				});
			}
		});
	}
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
	const thisTimesheetId = req.params.timesheetId;
	db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${thisTimesheetId}`, (error) => {
		if(error) {
			next(error);
		} else {
			res.status(204).send();
		}
	})
});