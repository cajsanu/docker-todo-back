const express = require('express');
const { Todo } = require('../mongo');
const { findById } = require('../mongo/models/Todo');
const router = express.Router();
const { setAsync, getAsync } = require("../redis/index")

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })

  let currentValue = await getAsync("added_todos");
  if (!currentValue) {
    currentValue = 0;
  }
  const newValue = parseInt(currentValue) + 1;
  await setAsync("added_todos", newValue);
  res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)
  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.send(req.todo)
  res.sendStatus(200);
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  await Todo.findByIdAndUpdate(req.todo.id, {...req.body})
  const updatedTodo = await Todo.findById(req.todo.id)
  res.send(updatedTodo)
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
