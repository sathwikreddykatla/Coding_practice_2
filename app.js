const express = require('express')
const app = express()
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'todoApplication.db')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')

app.use(express.json())
let db
app.listen(3000, async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    console.log('server is running at http://localhost:3000/')
  } catch (e) {
    console.log(`Error: ${e}`)
    process.exit(1)
  }
})

const StatusAndPriority = (search_q, status, priority) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and (status="${status}" and priority="${priority}") `
  return query
}
const Status = (status, search_q) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and status="${status}"`
  return query
}
const Priority = (priority, search_q) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and priority="${priority}"`
  return query
}
const CategoryAndStatus = (category, status, search_q) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and (priority="${priority} and status="${status}")"`
  return query
}
const Category = (category, search_q) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and priority="${category}"`
  return query
}
const CategoryAndPriority = (category, priority, search_q) => {
  const query = `SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%' and (priority="${priority} and category="${category}")"`
  return query
}

app.get('/todos/', async (request, response) => {
  const {search_q = '', status, priority, category} = request.query
  let get_query = null
  if (
    status !== undefined &&
    priority !== undefined &&
    category === undefined
  ) {
    get_query = await db.all(StatusAndPriority(search_q, status, priority))
  } else if (
    status != undefined &&
    priority === undefined &&
    category === undefined
  ) {
    get_query = await db.all(Status(search_q, status))
  } else if (
    status === undefined &&
    priority !== undefined &&
    category === undefined
  ) {
    get_query = await db.all(Priority(search_q, priority))
  } else if (
    category !== undefined &&
    status !== undefined &&
    priority === undefined
  ) {
    get_query = await db.all(CategoryAndStatus(search_q, category, status))
  } else if (
    priority === undefined &&
    status === undefined &&
    category !== undefined
  ) {
    get_query = await db.all(Category(search_q, category))
  } else if (
    category !== undefined &&
    status === undefined &&
    priority !== undefined
  ) {
    get_query = await db.all(CategoryAndPriority(search_q, category, priority))
  } else {
    get_query = await db.all(`SELECT * FROM todo
    WHERE todo LIKE '%${search_q}%'`)
  }
  response.send(get_query)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `SELECT id,todo,priority,status,category,due_date as dueDate
  FROM todo
  WHERE id="${todoId}"`
  const result = await db.get(query)
  response.send(result)
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  let d = new Date(date)
  console.log(d)
  const new_date = format(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    'yyyy-MM-dd',
  )
  console.log(new_date)
  const valid = isValid(d.getFullYear(), d.getMonth(), d.getDate())
  if (valid === true) {
    const query = `SELECT *
      FROM todo
      WHERE due_date="${new_date}";`
    const result = await db.get(query)
    console.log(query)
    response.send(result)
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const query = `INSERT INTO todo (id,todo,priority,status,category,due_date)
  values ("${id}","${todo}","${priority}","${status}","${category}","${dueDate}")`
  await db.run(query)
  response.send('Todo Successfully Added')
})

const get_query = (name, value, todoId) => {
  return `UPDATE todo
  SET ${name}="${value}"
  WHERE id="${todoId}";`
}

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body
  let name
  let query
  let msg
  if (todo !== undefined) {
    name = `todo`
    query = get_query(name, todo, todoId)
    msg = 'Todo Updated'
  } else if (priority !== undefined) {
    name = `priority`
    query = get_query(name, priority, todoId)
    msg = 'Priority Updated'
  } else if (status !== undefined) {
    name = `status`
    query = get_query(name, status, todoId)
    msg = 'Status Updated'
  } else if (category !== undefined) {
    name = `category`
    query = get_query(name, category, todoId)
    msg = 'Category Updated'
  } else if (dueDate !== undefined) {
    name = `dueDate`
    query = get_query(name, dueDate, todoId)
    msg = 'Due Date Updated'
  }
  await db.run(query)
  response.send(msg)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `DELETE FROM todo
  WHERE id="${todoId}";`
  await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
