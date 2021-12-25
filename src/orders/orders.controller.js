const path = require("path")
const orders = require(path.resolve("src/data/orders-data"))
const nextId = require("../utils/nextId")

function list(req, res) {
  res.status(200).json({ data: orders })
}

function validateOrder(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = req.body.data
  if (!deliverTo) {
    next({ status: 400, message: "Order must include a deliverTo" })
  } else if (!mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber" })
  } else if (!dishes) {
    next({ status: 400, message: "Order must include a dish" })
  } else if (!(Array.isArray(dishes) && dishes.length > 0)) {
    next({ status: 400, message: "Order must include at least one dish" })
  } else {
    dishes.forEach((dish, index) => {
      if (!(dish.quantity && dish.quantity > 0 && Number.isInteger(dish.quantity))) {
        next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        })
      }
    })
    res.locals.newOrder = req.body.data
    next()
  }
}

function create(req, res) {
  const newOrder = { id: nextId(), ...res.locals.newOrder }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}

function orderExists(req, res, next) {
  const { orderId } = req.params
  const foundOrder = orders.find((order) => order.id === orderId)
  if (foundOrder) {
    res.locals.foundOrder = foundOrder
    next()
  } else {
    next({ status: 404, message: `Order does not exist: ${orderId}.` })
  }
}

function read(req, res) {
  res.status(200).json({ data: res.locals.foundOrder })
}

function validateDelivery(req, res, next) {
  const orderStatus = req.body.data.status
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"]
  if (!validStatus.includes(orderStatus)) {
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    })
  } else if (orderStatus === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    })
  } else {
    next()
  }
}

function update(req, res, next) {
  if (req.body.data.id && req.body.data.id !== req.params.orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}`,
    })
  } else {
    delete res.locals.newOrder.id
    Object.assign(res.locals.foundOrder, res.locals.newOrder)
    res.status(200).json({ data: res.locals.foundOrder })
  }
}

function destroy(req, res, next) {
  if (res.locals.foundOrder.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    })
  } else {
    orders.splice(
      orders.findIndex((order) => order.id === req.params.orderId),
      1
    )
    res.sendStatus(204)
  }
}

module.exports = {
  list,
  create: [validateOrder, create],
  read: [orderExists, read],
  update: [orderExists, validateOrder, validateDelivery, update],
  destroy: [orderExists, destroy],
}
