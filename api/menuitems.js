const express = require('express');
const menuItemsRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

module.exports = menuItemsRouter;

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
	const query = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
	const values = { $menuItemId: menuItemId };
	db.get(query, values, (error, menuItem) => {
		if(error) {
			next(error)
		} else if (menuItem) {
			next();
		} else {
			res.sendStatus(404);
		}
	});
});

menuItemsRouter.get('/', (req, res, next) => {
	db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.params.menuId}`, (error, menuItems) => {
		if (error) {
			next(error);
		} else {
			res.status(200).json({ menuItems: menuItems });
		}
	});
});

menuItemsRouter.post('/', (req, res, next) => {
	const menuItem = req.body.menuItem;
	const name = menuItem.name;
	const description = menuItem.description;
	const inventory = menuItem.inventory;
	const price = menuItem.price;
	const menuId = req.params.menuId;
	db.get(`SELECT * FROM Menu WHERE Menu.id = ${menuId}`, (error) => {
		if(error) {
			next(error);
		} else {
			if(!name || !inventory || !price || !menuId) {
				return res.sendStatus(400);
			} else {
				const query = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)';
				const values = { 
					$name: name,
					$description: description,
					$inventory: inventory,
					$price: price,
					$menuId: menuId
				};
				db.run(query, values, function(error) {
					if(error) {
						next(error);
					}
					db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, menuItem) => {
						res.status(201).json({ menuItem: menuItem });
					});
				});
			}
		}
		
	});
});

menuItemsRouter.put('/:menuItemId', (req, res, next) => {
	const menuItem = req.body.menuItem;
	const name = menuItem.name;
	const description = menuItem.description;
	const inventory = menuItem.inventory;
	const price = menuItem.price;
	const menuId = req.params.menuId;
	if(!name || !inventory || !price || !menuId) {
		return res.sendStatus(400);
	} else {
		const query = 'UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $menuItemId';
		const values = { 
			$name: name,
			$description: description,
			$inventory: inventory,
			$price: price,
			$menuId: menuId,
			$menuItemId: req.params.menuItemId,
		};

		db.run(query, values, (error) => {
			if(error) {
				next(error);
			} else {
				db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${values.$menuItemId}`, (error, menuItem) => {
					res.status(200).json({ menuItem: menuItem });
				});
			}
		});
	}
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
	const thisMenuItemId = req.params.menuItemId;
	db.run(`DELETE FROM MenuItem WHERE MenuItem.id = ${thisMenuItemId}`, (error) => {
		if(error) {
			next(error);
		} else {
			res.sendStatus(204);
		}
	})
});