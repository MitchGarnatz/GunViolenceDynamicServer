// Built-in Node.js modules
let fs = require("fs");
let path = require("path");

// NPM modules
let express = require("express");
let sqlite3 = require("sqlite3");

let public_dir = path.join(__dirname, "public");
let template_dir = path.join(__dirname, "templates");
let db_filename = path.join(__dirname, "db", "gunviolence.sqlite3");

let app = express();
let port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.log("Error opening " + path.basename(db_filename));
  } else {
    console.log("Now connected to " + path.basename(db_filename));
  }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));

// GET request handler for home page '/' (redirect to desired route)
app.get("/", (req, res) => {
  let home = "/index.html";
  res.redirect(home);
});

/*
// Example GET request handler for data about a specific year
app.get('/year/:selected_year', (req, res) => {
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'year.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});
*/

app.get("/state/:selected_state", (req, res) => {
  let state = req.params.selected_state;
  console.log(req.params.selected_state);
  fs.readFile(path.join(template_dir, "state.html"), (err, template) => {
    let query =
      "SELECT GunViolence.id, GunViolence.date, GunViolence.state, GunViolence.killed, \
      GunViolence.injured FROM GunViolence WHERE GunViolence.state = ?";

    db.all(query, [state], (err, rows) => {
      console.log(err);
      console.log(rows);
      let response = template.toString();
      response = response.replace("%%STATE_TITLE%%", rows[0].state);
      response = response.replace("%%STATE_HEADER%%", rows[0].state);
      response = response.replace("%%STATE_ALT_TEXT%%", "logo for " + rows[0].state);
      response = response.replace("%%STATE_IMAGE%%", "/images/" + state + ".png");
      let state_data = "";
      for (let i = 0; i < rows.length; i++) {
        state_data += "<tr>";
        state_data += "<td>" + rows[i].id + "</td>";
        state_data += "<td>" + rows[i].date + "</td>";
        state_data += "<td>" + rows[i].state + "</td>";
        state_data += "<td>" + rows[i].killed + "</td>";
        state_data += "<td>" + rows[i].injured + "</td>";
        state_data += "</tr>";
      }
      response = response.replace("%%STATE_INFO%%", state_data);
      res.status(200).type("html").send(response);
    });
  });
});

app.listen(port, () => {
  console.log("Now listening on port " + port);
});
