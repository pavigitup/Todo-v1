const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const dateFns = require("date-fns/format");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  let condition;
  if (status !== "") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      condition = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      condition = false;
    }
  }
  if (priority !== "") {
    if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
      condition = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      condition = false;
    }
  }
  if (category !== "") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      condition = true;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      condition = false;
    }
  }
  if (search_q !== "") {
    condition = true;
  }
  if (condition === true) {
    const getAllTodo = `
    SELECT *
    FROM todo
     WHERE status LIKE '%${status}%' AND
    priority LIKE '%${priority}%' AND
    todo LIKE '%${search_q}%' AND
    category LIKE '%${category}%';
    `;
    const allTodo = await db.all(getAllTodo);

    const allCapsTodo = (allTodo) => {
      return {
        id: allTodo.id,
        todo: allTodo.todo,
        priority: allTodo.priority,
        status: allTodo.status,
        category: allTodo.category,
        dueDate: allTodo.due_date,
      };
    };
    response.send(allTodo.map((e) => allCapsTodo(e)));
  }
});

app.get("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const getTodo = `SELECT *
    FROM todo
    WHERE id = ${todoId}`;
  const todo = await db.get(getTodo);
  const ans = (todo) => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    };
  };

  res.send(ans(todo));
});

app.get("/agenda/", async (req, res) => {
  const { date } = req.query;

  const newDate = dateFns(new Date(`${date}`), "yyyy-MM-dd");

  const getSpecificDate = `
    SELECT *
    FROM todo
    WHERE due_date = '${newDate}'`;
  const dueDate = await db.get(getSpecificDate);
  res.send(dueDate);
});

app.post("/todos/", async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  let condition;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    condition = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
    condition = false;
  }
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    condition = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
    condition = false;
  }

  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    condition = true;
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
    condition = false;
  }

  if (condition === true) {
    const createTodo = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    );`;
    await db.run(createTodo);
    res.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = req.body;
  const updateTodo = `
    UPDATE todo
    SET 
    status = '${status}',
    priority = '${priority}',
    category = '${category}',
    todo = '${todo}',
    due_date = '${dueDate}'
    WHERE id = ${todoId};`;
  await db.run(updateTodo);
  if (status !== "") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      res.send("Status Updated");
    } else {
      res.send("Invalid Todo Status");
    }
  } else if (priority !== "") {
    if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
      res.send("Priority Updated");
    } else {
      res.send("Invalid Todo Priority");
    }
  } else if (todo !== "") {
    res.send("Todo Updated");
  } else if (category !== "") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      res.send("Category Updated");
    } else {
      res.send("Invalid Todo Category");
    }
  } else if (dueDate !== "") {
    res.send("Due Date Updated");
  }
});

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodo = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodo);
  res.send("Todo Deleted");
});

module.exports = app;
