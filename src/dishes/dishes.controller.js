const path = require("path")
const dishes = require(path.resolve("src/data/dishes-data"))
const nextId = require("../utils/nextId")

function list(req, res) {
  res.status(200).json({ data: dishes })
}

function validateDish(req, res, next) {
  const { name, description, price, image_url } = req.body.data
  if (!name) {
    next({ status: 400, message: `Dish must include a name` })
  } else if (!description) {
    next({ status: 400, message: "Dish must include a description" })
  } else if (!price) {
    next({ status: 400, message: "Dish must include a price" })
  } else if (!image_url) {
    next({ status: 400, message: "Dish must include a image_url" })
  } else if (!(Number.isInteger(price) && price > 0)) {
    next({ status: 400, message: "Dish must have a price that is an integer greater than 0" })
  } else {
    res.locals.newDish = req.body.data
    next()
  }
}

function create(req, res) {
  const newDish = { id: nextId(), ...res.locals.newDish }
  dishes.push(newDish)
  res.status(201).json({ data: newDish })
}

function dishExists(req, res, next) {
  const { dishId } = req.params
  const foundDish = dishes.find((dish) => dish.id === dishId)
  if (foundDish) {
    res.locals.foundDish = foundDish
    next()
  } else {
    next({ status: 404, message: `Dish does not exist: ${dishId}.` })
  }
}

function read(req, res) {
  res.status(200).json({ data: res.locals.foundDish })
}

function update(req, res, next) {
  if (req.body.data.id && req.body.data.id !== req.params.dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`,
    })
  } else {
    delete res.locals.newDish.id
    Object.assign(res.locals.foundDish, res.locals.newDish)
    res.status(200).json({ data: res.locals.foundDish })
  }
}

module.exports = {
  list,
  create: [validateDish, create],
  read: [dishExists, read],
  update: [dishExists, validateDish, update],
}
