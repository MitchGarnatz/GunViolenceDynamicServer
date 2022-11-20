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
  let home = "/homepage";
  res.redirect(home);
  
});

app.get("/homepage", (req, res) => {
  fs.readFile(
    path.join(public_dir, "homepage.html"),
    (err, template) => {
      let query = "SELECT States.name FROM States";
      db.all(query, [], (err, rows) => {
        console.log(err);
        console.log(rows);
        let response = template.toString();
        let state_data = "";
        for (let i = 0; i < rows.length; i++) {
          state_data += "<li>";
          state_data +=
            "<a href='/state/" + rows[i].name + "'>" + rows[i].name + "</a>";
          state_data += "</li>";
        }
        response = response.replace("%%STATES%%", state_data);


        res.status(200).type("html").send(response);
      });
    }
  );
});

// Kevin - By State
app.get("/state/:selected_state", (req, res) => {
  let state = req.params.selected_state;
  fs.readFile(path.join(template_dir, "state.html"), async (err, template) => {
    let stateQuery = "SELECT DISTINCT state FROM GunViolence";
    let stateFound = false;

    await new Promise((resolve,reject)=>{
      db.all(stateQuery,[],(err,rows)=>{
        if(err) {
          reject(err);
        }
        resolve(rows);
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
      return res.status(404).send({'404 error page' :req.params.selected_state + ' state does not exist. Check capitalization & spaces.'});
    }

    // if the state is in the database
    // run the query

    if (stateFound) {
      let response = template.toString();
      let query =
        "SELECT GunViolence.id, GunViolence.date, GunViolence.state, GunViolence.killed, \
        GunViolence.injured FROM GunViolence WHERE GunViolence.state = ?";

      db.all(query, [state], (err, rows) => {
        console.log(err);
        console.log(rows);

        let year2014 = 0;
        let year2015 = 0;
        let year2016 = 0;
        let year2017 = 0;
        let year2018 = 0;

        for (let i = 0; i < rows.length; i++) {
          if (rows[i].date.includes("2014")) {
            year2014++;
          }
          if (rows[i].date.includes("2015")) {
            year2015++;
          }
          if (rows[i].date.includes("2016")) {
            year2016++;
          }
          if (rows[i].date.includes("2017")) {
            year2017++;
          }
          if (rows[i].date.includes("2018")) {
            year2018++;
          }
        }
        console.log(
          "west " +
            year2014 +
            ", southwest " +
            year2015 +
            ", midwest " +
            year2016 +
            ", southeast " +
            year2017 +
            ", northeast " +
            year2018
        );
        response = response.replace("%%2014%%", year2014);
        response = response.replace("%%2015%%", year2015);
        response = response.replace("%%2016%%", year2016);
        response = response.replace("%%2017%%", year2017);
        response = response.replace("%%2018%%", year2018);

        response = response.replace("%%STATE%%", rows[0].state);
        response = response.replace("%%STATE_TITLE%%", rows[0].state);
        response = response.replace("%%STATE_HEADER%%", rows[0].state);
        response = response.replace(
          "%%STATE_ALT_TEXT%%",
          "logo for " + rows[0].state
        );
        response = response.replace(
          "%%STATE_IMAGE%%",
          "/images/" + state + ".png"
        );
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

// Mitch - By Day
app.get('/day/:selected_date', (req, res) => {
  let date = req.params.selected_date;
  fs.readFile(path.join(template_dir, 'day.html'), async (err, template) => {

    let dateQuery = "SELECT DISTINCT day FROM GunViolence";
    let dateFound = false;
  
    await new Promise((resolve,reject)=>{
      db.all(dateQuery,[],(err,rows)=>{
        if(err) {
          reject(err);
        }
        resolve(rows);
        for (var i = 0; i < rows.length; i++) {
            if (req.params.selected_date == rows[i]['day']) { 
            dateFound = true;  
          }
        }
      });
    });

    if(dateFound == false) {
      return res.status(404).send({'404 error page' :req.params.selected_date + ' date does not exist. Check capitalization & spaces.'});
    }
  
    if (dateFound) {

      let response = template.toString();

      let query =
      "SELECT GunViolence.id, GunViolence.date, GunViolence.day, GunViolence.state, GunViolence.killed, \
      GunViolence.injured FROM GunViolence WHERE GunViolence.day = ?";

      let queryDay = "SELECT GunViolence.state FROM GunViolence WHERE GunViolence.day = ?";

      db.all(queryDay, [date], (err, rows) => {
        console.log(err);
        console.log(rows);

        let illinois = 0;
        let indiana = 0;
        let iowa = 0;
        let kansas = 0;
        let michigan = 0;
        let minnesota = 0;
        let missouri = 0;
        let nebraska = 0;
        let northDakota = 0;
        let ohio = 0;
        let southDakota = 0;
        let wisconsin = 0;

        for(let i=0; i<rows.length; i++) {
          if (rows[i].state === 'Illinois') {
            illinois++;
          }
          if (rows[i].state === 'Indiana') {
            indiana++;
          }
          if (rows[i].state === 'Iowa') {
            iowa++;
          }
          if (rows[i].state === 'Kansas') {
            kansas++
          }
          if (rows[i].state === 'Michigan') {
            michigan++;
          }
          if (rows[i].state === 'Minnesota') {
            minnesota++;
          }
          if (rows[i].state === 'Missouri') {
            missouri++;
          }
          if (rows[i].state === 'Nebraska') {
            nebraska++;
          }
          if (rows[i].state === 'North Dakota') {
            northDakota++;
          }
          if (rows[i].state === 'Ohio') {
            ohio++;
          }
          if (rows[i].state === 'South Dakota') {
            southDakota++;
          }
          if (rows[i].state === 'Wisconsin') {
            wisconsin++;
          }

        }
        console.log(wisconsin);
        response = response.replace("%%11%%", illinois);
        response = response.replace("%%22%%", indiana);
        response = response.replace("%%33%%", iowa);
        response = response.replace("%%44%%", kansas);
        response = response.replace("%%55%%", michigan);
        response = response.replace("%%66%%", minnesota);
        response = response.replace("%%77%%", missouri);
        response = response.replace("%%88%%", nebraska);
        response = response.replace("%%99%%", northDakota);
        response = response.replace("%%11%%", ohio);
        response = response.replace("%%12%%", southDakota);
        response = response.replace("%%13%%", wisconsin);
        
        });

    db.all(query, [date], (err, rows) => {
      let date_data = "";
      for(let i=0; i<rows.length; i++) {
        date_data += "<tr>";
        date_data += "<td>" + rows[i].id + "</td>";
        date_data += "<td>" + rows[i].date + "</td>";
        response = response.replace("%%DATE_HEADER%%", rows[0].date);
        response = response.replace("%%DAY%%", rows[0].day);
        date_data += "<td>" + rows[i].day + "</td>";
        date_data += "<td>" + rows[i].state + "</td>";
        date_data += "<td>" + rows[i].killed + "</td>";
        date_data += "<td>" + rows[i].injured + "</td>";
        date_data += "</tr>";
        }
      response = response.replace("%%DATE_INFO%%", date_data);
      res.status(200).type("html").send(response);
      });
    }
  });
});


//Mitch - End

// Anisa - By Year
app.get('/year/:selected_year', (req, res) => {
  let date = req.params.selected_year;
  fs.readFile(path.join(template_dir, 'year.html'), async (err, template) => {
    // modify `template` and send response
    // this will require a query to the SQL database
    let response = template.toString();

    let dateFound = false;

    // START
    let dateQuery = "SELECT DISTINCT date FROM GunViolence";
    await new Promise((resolve,reject)=>{
      db.all(dateQuery,[],(err,rows)=>{
        if (err) {
          reject(err);
        }
        resolve(rows);
        for (var i = 0; i < rows.length; i++) { 
          if (req.params.selected_year == rows[i]['date'].split('-')[0]) { 
            dateFound = true;  
          }
  
        }
      });
      });
    // ENDgit
    // return a 404 return if the date was not found
    if(!dateFound) {
      return res.status(404).send({ '404 error page' :req.params.selected_year + ' year does not exist'});
    }

    let query =
      "SELECT GunViolence.id, GunViolence.date, GunViolence.state, GunViolence.killed, \
    GunViolence.injured FROM GunViolence WHERE strftime('%Y',GunViolence.date)= ?";
    //let DATA_TITLE = strftime('%Y',GunViolence.date);
    //let DATE_HEADER = strftime('%Y',GunViolence.date);
    let queryRegions = 
      "SELECT States.region FROM States INNER JOIN GunViolence ON \
    States.name = GunViolence.state WHERE strftime('%Y',GunViolence.date) = ? LIMIT 10000";
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

      console.log("Rows: " + rows.length);
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
