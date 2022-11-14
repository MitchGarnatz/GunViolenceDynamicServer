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
  fs.readFile(path.join(template_dir, "state.html"), async (err, template) => {
    let stateQuery = "SELECT DISTINCT state FROM GunViolence";

    let stateFound = false;

    await new Promise((resolve,reject)=>{
      db.all(stateQuery,[],(err,rows)=>{
        if(err)reject(err)
                    resolve(rows)
        for (var i = 0; i < rows.length; i++) {
     
          if (req.params.selected_state == rows[i]['state']) { 
            stateFound = true;  
          }
  
        }
      });
      });
   
    console.log(stateFound);

    // if the state was not found 
    // return 404
    if(stateFound == false) {
      return res.status(404).send({'404 error page' :req.params.selected_state + ' state does not exist'});
    }

    // if the state is in the database
    // run the query

    if (stateFound) {
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
    }

  });
});
app.get('/date/:selected_date', (req, res) => {
  let date = req.params.selected_date;
  fs.readFile(path.join(template_dir, 'year.html'), async (err, template) => {
    // modify `template` and send response
    // this will require a query to the SQL database
    let response = template.toString();

    let dateFound = false;

    // START
    let dateQuery = "SELECT DISTINCT date FROM GunViolence";
    await new Promise((resolve,reject)=>{
      db.all(dateQuery,[],(err,rows)=>{
        if(err)reject(err)
                    resolve(rows)
        for (var i = 0; i < rows.length; i++) { 
          if (req.params.selected_date == rows[i]['date'].split('-')[0]) { 
            dateFound = true;  
          }
  
        }
      });
      });
    // ENDgit
    // return a 404 return if the date was not found
    if(!dateFound) {
      return res.status(404).send({ '404 error page' :req.params.selected_date + ' year does not exist'});
    }

    let query =
      "SELECT GunViolence.id, GunViolence.date, GunViolence.state, GunViolence.killed, \
    GunViolence.injured FROM GunViolence WHERE strftime('%Y',GunViolence.date)= ?";
    //let DATA_TITLE = strftime('%Y',GunViolence.date);
    //let DATE_HEADER = strftime('%Y',GunViolence.date);
    let queryRegions = "SELECT States.region FROM States WHERE States.name IN (SELECT GunViolence.state FROM GunViolence WHERE strftime('%Y',GunViolence.date) = ?)";
    console.log(queryRegions);


    db.all(queryRegions, [date], (err, rows) => {
      console.log(err);
      console.log(rows);
      console.log(rows.length);

      let west = 0;
      let southwest = 0;
      let midwest = 0;
      let southeast = 0;
      let northeast = 0;
      let pacific = 0;

      for (let i = 0; i < rows.length; i++) {
        if (rows[i].region === 0) {
          west++;
        }
        if (rows[i].region === 1) {
          southwest++;
        }
        if (rows[i].region === 2) {
          midwest++;
        }
        if (rows[i].region === 3) {
          southeast++
        }
        if (rows[i].region === 4) {
          northeast++;
        }
        if (rows[i].region === 5) {
          pacific++;
        }
        console.log("west " + west + ", southwest " + southwest + ", midwest " + midwest + ", southeast " + southeast + ", northeast " + northeast + ", pacific " + pacific);
      }
      response = response.replace("%%West%%", west);
      response = response.replace("%%Southwest%%", southwest);
      response = response.replace("%%Midwest%%", midwest);
      response = response.replace("%%Southeast%%", southeast);
      response = response.replace("%%Northeast%%", northeast);
      response = response.replace("%%Pacific%%", pacific);


    });

    db.all(query, [date], (err, rows) => {
      //console.log(err);
      //console.log(rows);
      response = response.replace("%%DATE_TITLE%%", rows[0].date);
      response = response.replace("%%DATE_HEADER%%", rows[0].date);
      response = response.replace("%%DATE%%", rows[0].date);
      let date_data = "";
      for (let i = 0; i < rows.length; i++) {
        date_data += "<tr>";
        date_data += "<td>" + rows[i].id + "</td>";
        date_data += "<td>" + rows[i].date + "</td>";
        date_data += "<td>" + rows[i].state + "</td>";
        date_data += "<td>" + rows[i].killed + "</td>";
        date_data += "<td>" + rows[i].injured + "</td>";
        date_data += "</tr>";
      }
      response = response.replace("%%DATE_INFO%%", date_data);
      res.status(200).type("html").send(response);
    });
  });
});


app.use(function (req, res) {
  res.status(404).end('404 error, cant find that page');
});


app.listen(port, () => {
  console.log("Now listening on port " + port);
});